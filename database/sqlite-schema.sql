-- Local SQLite 3 planning schema.
-- This project currently runs with data/db.json so it needs zero database installation.
-- Use this file only if you later decide to rewrite the storage layer to SQLite.

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
  created_at text not null
);

create table if not exists students (
  id text primary key,
  user_id text not null references portal_users(id) on delete cascade,
  roll_number text unique not null,
  gender text,
  dob text,
  blood_group text,
  department text not null,
  course text not null,
  year text not null,
  semester text not null,
  academics_json text not null default '{}',
  updated_at text not null
);

create table if not exists faculty (
  id text primary key,
  user_id text not null references portal_users(id) on delete cascade,
  faculty_code text,
  qualification text,
  experience text,
  blood_group text,
  department text not null,
  assigned_years_json text not null default '[]',
  status text not null default 'active',
  updated_at text not null
);

create table if not exists notifications (
  id text primary key,
  title text not null,
  body text not null,
  type text not null default 'portal',
  to_roles_json text not null default '[]',
  to_user_ids_json text not null default '[]',
  department text,
  read_by_json text not null default '[]',
  created_at text not null
);

create table if not exists audit_logs (
  id text primary key,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  target_name text,
  created_at text not null
);
