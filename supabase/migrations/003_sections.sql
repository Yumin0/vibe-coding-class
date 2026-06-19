create table sections (
  id bigint primary key generated always as identity,
  cohort_id bigint not null references cohorts(id),
  column_type text not null check (column_type in ('input', 'progress', 'output')),
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
