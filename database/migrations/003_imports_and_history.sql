create table if not exists contract_imports (
  id uuid primary key default gen_random_uuid(),
  filename varchar(255) not null,
  stored_filename varchar(255),
  user_id uuid references users(id),
  status varchar(30) not null default 'UPLOADED' check (status in ('UPLOADED', 'VALIDATING', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  total_rows integer not null default 0,
  new_records integer not null default 0,
  updated_records integer not null default 0,
  unchanged_records integer not null default 0,
  possible_absent_records integer not null default 0,
  error_records integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_imports_user_id on contract_imports(user_id);
create index if not exists idx_contract_imports_status on contract_imports(status);
create index if not exists idx_contract_imports_created_at on contract_imports(created_at);

create table if not exists contract_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references contract_imports(id) on delete cascade,
  row_number integer not null,
  contract_key varchar(90),
  action varchar(30) not null check (action in ('NEW', 'UPDATE', 'UNCHANGED', 'ERROR')),
  raw_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  differences jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_contract_import_rows_import_id on contract_import_rows(import_id);
create index if not exists idx_contract_import_rows_contract_key on contract_import_rows(contract_key);
create index if not exists idx_contract_import_rows_action on contract_import_rows(action);

create table if not exists contract_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  user_id uuid references users(id),
  field_name varchar(120) not null,
  old_value text,
  new_value text,
  change_source varchar(30) not null check (change_source in ('MANUAL', 'IMPORTACAO', 'SISTEMA', 'API')),
  import_id uuid references contract_imports(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_contract_history_contract_id on contract_history(contract_id);
create index if not exists idx_contract_history_import_id on contract_history(import_id);
create index if not exists idx_contract_history_created_at on contract_history(created_at);
