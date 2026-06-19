create table todo_templates (
  id bigint primary key generated always as identity,
  section_id bigint not null references sections(id),
  title text not null,
  subtitle text,
  description text,
  is_required boolean not null default true,
  unlock_after bigint,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table todo_templates
  add constraint fk_unlock_after
  foreign key (unlock_after) references todo_templates(id);
