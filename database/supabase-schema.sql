-- Supabase uses PostgreSQL, not SQLite.
-- Run this in Supabase SQL Editor if you later migrate the portal from JSON storage to Supabase.

create table if not exists portal_users (
  id text primary key,
  role text not null check (role in ('student', 'faculty', 'hod')),
  name text not null,
  email text unique not null,
  username text unique not null,
  phone text,
  department text,
  status text not null default 'active',
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id text primary key,
  user_id text not null references portal_users(id) on delete cascade,
  roll_number text unique not null,
  gender text,
  dob date,
  blood_group text,
  department text not null,
  course text not null,
  year text not null,
  semester text not null,
  academics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists faculty (
  id text primary key,
  user_id text not null references portal_users(id) on delete cascade,
  faculty_code text,
  qualification text,
  experience text,
  blood_group text,
  department text not null,
  assigned_years jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  title text not null,
  body text not null,
  type text not null default 'portal',
  to_roles jsonb not null default '[]'::jsonb,
  to_user_ids jsonb not null default '[]'::jsonb,
  department text,
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  target_name text,
  created_at timestamptz not null default now()
);

create index if not exists students_department_idx on students(department);
create index if not exists faculty_department_idx on faculty(department);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);
