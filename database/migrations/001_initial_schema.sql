create extension if not exists "pgcrypto";

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  key varchar(40) not null unique,
  name varchar(120) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  key varchar(80) not null unique,
  name varchar(120) not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(180) not null,
  registration varchar(40) not null unique,
  email varchar(180) not null unique,
  position varchar(120),
  role_id uuid not null references roles(id),
  password_hash text not null,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role_id on users(role_id);
create index if not exists idx_users_active on users(active);

create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  key varchar(120) not null unique,
  value text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists session (
  sid varchar not null primary key,
  sess json not null,
  expire timestamp(6) not null
);

create index if not exists idx_session_expire on session(expire);
