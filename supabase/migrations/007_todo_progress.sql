create table todo_progress (
  id bigint primary key generated always as identity,
  enrollment_id bigint not null references enrollments(id),
  todo_template_id bigint not null references todo_templates(id),
  status text not null default 'pending' check (status in ('pending', 'done')),
  completed_at timestamptz,
  note text,
  submission_url text,
  unique(enrollment_id, todo_template_id)
);
