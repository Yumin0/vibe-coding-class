create table cohorts (
  id bigint primary key generated always as identity,
  template_id bigint not null references course_templates(id),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  starts_at date,
  ends_at date,
  max_students int,
  created_at timestamptz not null default now()
);
