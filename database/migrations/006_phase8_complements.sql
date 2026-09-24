create table if not exists contract_documents (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  user_id uuid references users(id),
  category varchar(60) not null check (category in ('CONTRATO', 'TERMO_ADITIVO', 'APOSTILAMENTO', 'PROPOSTA', 'PARECER', 'DOCUMENTACAO_FORNECEDOR', 'OUTROS')),
  description text,
  original_name varchar(255) not null,
  storage_path varchar(500) not null,
  mime_type varchar(120),
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_contract_documents_contract_id on contract_documents(contract_id);
create index if not exists idx_contract_documents_category on contract_documents(category);

create table if not exists contract_notes (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  user_id uuid references users(id),
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_notes_contract_id on contract_notes(contract_id);
create index if not exists idx_contract_notes_created_at on contract_notes(created_at);

alter table system_settings
  add column if not exists value_type varchar(30) not null default 'string';
