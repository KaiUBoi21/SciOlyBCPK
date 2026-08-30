-- Display capacity for a team's seat grid on the roster wall chart.
alter table public.teams add column capacity int not null default 15;
