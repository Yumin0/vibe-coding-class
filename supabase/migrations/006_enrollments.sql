create table enrollments (
  id bigint primary key generated always as identity,
  student_id uuid not null references users(id),
  cohort_id bigint not null references cohorts(id),
  status text not null default 'active' check (status in ('active', 'dropped', 'completed')),
  enrolled_at timestamptz not null default now(),
  unique(student_id, cohort_id)
);
