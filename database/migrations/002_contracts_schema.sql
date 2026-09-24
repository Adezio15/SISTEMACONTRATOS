create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  legal_name varchar(220) not null,
  trade_name varchar(220),
  document_number varchar(20) not null unique,
  document_type varchar(10) not null check (document_type in ('CNPJ', 'CPF', 'OUTRO')),
  email varchar(180),
  phone varchar(40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_companies_legal_name on companies(legal_name);
create index if not exists idx_companies_document_number on companies(document_number);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number varchar(60) not null,
  contract_year integer not null,
  contract_key varchar(90) not null unique,
  company_id uuid references companies(id),
  supplier_name varchar(220) not null,
  document_number varchar(20),
  object text not null,
  unit varchar(140),
  initial_value numeric(14, 2) not null default 0,
  updated_value numeric(14, 2),
  current_balance numeric(14, 2),
  start_date date,
  end_date date,
  status varchar(30) not null default 'ATIVO' check (status in ('ATIVO', 'VENCIDO', 'CANCELADO', 'ENCERRADO', 'SUSPENSO')),
  external_status varchar(80),
  source varchar(40) not null default 'MANUAL',
  first_imported_at timestamptz,
  last_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contracts_company_id on contracts(company_id);
create index if not exists idx_contracts_contract_year on contracts(contract_year);
create index if not exists idx_contracts_status on contracts(status);
create index if not exists idx_contracts_end_date on contracts(end_date);
create index if not exists idx_contracts_supplier_name on contracts(supplier_name);
create index if not exists idx_contracts_unit on contracts(unit);

create table if not exists contract_responsibles (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  role varchar(40) not null check (role in ('ANALISTA', 'FISCAL', 'GESTOR', 'CONTRATANTE')),
  user_id uuid references users(id),
  name varchar(180),
  email varchar(180),
  registration varchar(40),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or name is not null)
);

create index if not exists idx_contract_responsibles_contract_id on contract_responsibles(contract_id);
create index if not exists idx_contract_responsibles_role on contract_responsibles(role);
create unique index if not exists uniq_active_contract_user_responsible
  on contract_responsibles(contract_id, role, user_id)
  where user_id is not null and active = true;
