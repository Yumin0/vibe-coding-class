create table submissions (
  id bigint primary key generated always as identity,
  todo_progress_id bigint not null references todo_progress(id),
  file_url text,
  description text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references users(id),
  review_status text default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  review_note text
);
