-- BASIS Cedar Park Science Olympiad team hub — initial schema.
--
-- Model: every signed-in user is trusted team staff (captain / coach / admin).
-- All staff can read and write all hub data; RLS just requires authentication.
-- Division B (middle school) and Division C (high school) are kept distinct via
-- the division_code enum on every division-scoped row.

create type division_code as enum ('B', 'C');
create type app_role as enum ('captain', 'coach', 'admin');

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on sign-up
-- ---------------------------------------------------------------------------
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  role       app_role not null default 'coach',
  created_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- This runs only as a trigger; nobody should call it via the Data API (rpc).
revoke execute on function handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- roster
-- ---------------------------------------------------------------------------
create table students (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  division   division_code not null,
  grad_year  int,
  notes      text not null default '',
  created_at timestamptz not null default now()
);

create table teams (
  id         uuid primary key default gen_random_uuid(),
  division   division_code not null,
  name       text not null,
  code       text not null,
  created_at timestamptz not null default now(),
  unique (division, code)
);

create table team_members (
  team_id    uuid not null references teams (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  primary key (team_id, student_id)
);

-- ---------------------------------------------------------------------------
-- events & pairings
-- ---------------------------------------------------------------------------
create table events (
  id       uuid primary key default gen_random_uuid(),
  division division_code not null,
  name     text not null,
  unique (division, name)
);

-- One partner pairing (1 or 2 students) for an event on a team.
create table pairings (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams (id) on delete cascade,
  event_id    uuid not null references events (id) on delete cascade,
  student1_id uuid not null references students (id) on delete restrict,
  student2_id uuid references students (id) on delete restrict,
  created_at  timestamptz not null default now(),
  unique (team_id, event_id)
);

-- ---------------------------------------------------------------------------
-- scores
-- ---------------------------------------------------------------------------
-- Practice-test scores: one row per attempt, so a pairing's trend is the
-- ordered set of its rows over time.
create table practice_scores (
  id          uuid primary key default gen_random_uuid(),
  pairing_id  uuid not null references pairings (id) on delete cascade,
  taken_on    date not null default current_date,
  raw_score   numeric,
  max_score   numeric,
  placement   int,
  notes       text not null default '',
  recorded_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table competitions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  division   division_code not null,
  held_on    date,
  location   text not null default '',
  created_at timestamptz not null default now()
);

create table competition_scores (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  event_id       uuid not null references events (id) on delete cascade,
  team_id        uuid not null references teams (id) on delete cascade,
  placement      int,
  points         numeric,
  notes          text not null default '',
  recorded_by    uuid references profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (competition_id, event_id, team_id)
);

-- ---------------------------------------------------------------------------
-- test bank: links out (e.g. Google Drive), not hosted files
-- ---------------------------------------------------------------------------
create table test_bank_links (
  id         uuid primary key default gen_random_uuid(),
  division   division_code not null,
  event_id   uuid references events (id) on delete set null,
  title      text not null,
  url        text not null,
  source     text not null default '',
  added_by   uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles            enable row level security;
alter table students            enable row level security;
alter table teams               enable row level security;
alter table team_members        enable row level security;
alter table events              enable row level security;
alter table pairings            enable row level security;
alter table practice_scores     enable row level security;
alter table competitions        enable row level security;
alter table competition_scores  enable row level security;
alter table test_bank_links     enable row level security;

-- profiles: everyone signed in can read; you may only edit your own row.
-- (Inserts happen through the on_auth_user_created trigger.)
create policy "profiles read"   on profiles for select to authenticated using (true);
create policy "profiles update" on profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Hub data: any authenticated staff member has full access.
create policy "students all"           on students           for all to authenticated using (true) with check (true);
create policy "teams all"              on teams              for all to authenticated using (true) with check (true);
create policy "team_members all"       on team_members       for all to authenticated using (true) with check (true);
create policy "events all"             on events             for all to authenticated using (true) with check (true);
create policy "pairings all"           on pairings           for all to authenticated using (true) with check (true);
create policy "practice_scores all"    on practice_scores    for all to authenticated using (true) with check (true);
create policy "competitions all"       on competitions       for all to authenticated using (true) with check (true);
create policy "competition_scores all" on competition_scores for all to authenticated using (true) with check (true);
create policy "test_bank_links all"    on test_bank_links    for all to authenticated using (true) with check (true);
