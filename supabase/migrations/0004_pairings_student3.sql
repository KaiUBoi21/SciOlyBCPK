-- A few events (Experimental Design, Codebusters) run 3 people per team.
-- Third slot is optional, same on-delete rule as the other partner columns.
alter table public.pairings
  add column student3_id uuid references students (id) on delete restrict;
