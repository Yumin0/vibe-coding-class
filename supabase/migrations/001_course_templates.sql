create table course_templates (
  id bigint primary key generated always as identity,
  title text not null,
  level text not null check (level in ('beginner', 'advanced')),
  description text,
  created_at timestamptz not null default now()
);
