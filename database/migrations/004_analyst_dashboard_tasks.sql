create table if not exists contract_tasks (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  title varchar(180) not null,
  description text,
  responsible_user_id uuid references users(id),
  created_by_user_id uuid references users(id),
  due_date date,
  priority varchar(20) not null default 'NORMAL' check (priority in ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')),
  status varchar(30) not null default 'PENDENTE' check (status in ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contract_tasks_contract_id on contract_tasks(contract_id);
create index if not exists idx_contract_tasks_responsible_user_id on contract_tasks(responsible_user_id);
create index if not exists idx_contract_tasks_due_date on contract_tasks(due_date);
create index if not exists idx_contract_tasks_status on contract_tasks(status);
