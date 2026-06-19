create table users (
  id uuid primary key references auth.users(id),
  name text not null,
  role text not null default 'student' check (role in ('admin', 'instructor', 'student')),
  avatar_url text,
  created_at timestamptz not null default now()
);
