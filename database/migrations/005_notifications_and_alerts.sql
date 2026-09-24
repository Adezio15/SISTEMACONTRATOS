create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id) on delete cascade,
  event_key varchar(160) not null unique,
  event_type varchar(60) not null,
  severity varchar(20) not null default 'INFO' check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  title varchar(180) not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_events_contract_id on notification_events(contract_id);
create index if not exists idx_notification_events_type on notification_events(event_type);
create index if not exists idx_notification_events_created_at on notification_events(created_at);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid references notification_events(id) on delete cascade,
  contract_id uuid references contracts(id) on delete cascade,
  title varchar(180) not null,
  message text not null,
  link_url varchar(255),
  read_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_user_unread on notifications(user_id, read_at) where read_at is null;
create index if not exists idx_notifications_event_id on notifications(event_id);
create unique index if not exists uniq_notifications_user_event
  on notifications(user_id, event_id)
  where event_id is not null;
