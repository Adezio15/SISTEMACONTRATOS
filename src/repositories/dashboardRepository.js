const { getPool } = require('../config/database');

function analystResponsibleCondition(alias = 'cr') {
  return `
    ${alias}.active = true
    and ${alias}.role = 'ANALISTA'
    and (
      ${alias}.user_id = $1
      or ${alias}.registration = $2
      or lower(${alias}.name) = lower($3)
    )
  `;
}

async function getAnalystMetrics(user) {
  const params = [user.id, user.registration, user.name];
  const { rows } = await getPool().query(
    `
      with my_contracts as (
        select distinct c.*
        from contracts c
        join contract_responsibles cr on cr.contract_id = c.id
        where ${analystResponsibleCondition('cr')}
      ),
      contract_balance as (
        select
          id,
          case
            when coalesce(updated_value, initial_value) > 0
            then (coalesce(current_balance, 0) / coalesce(updated_value, initial_value)) * 100
            else null
          end as balance_percentage
        from my_contracts
      )
      select
        (select count(*)::int from my_contracts) as my_contracts,
        (
          select count(*)::int
          from my_contracts
          where end_date between current_date and current_date + interval '90 days'
            and status = 'ATIVO'
        ) as expiring_contracts,
        (
          select count(*)::int
          from contract_balance
          where balance_percentage <= 10
        ) as critical_balance_contracts,
        (
          select count(*)::int
          from contract_tasks
          where responsible_user_id = $1
            and status in ('PENDENTE', 'EM_ANDAMENTO')
        ) as pending_tasks,
        (
          select count(*)::int
          from contract_tasks
          where responsible_user_id = $1
            and status in ('PENDENTE', 'EM_ANDAMENTO')
            and due_date < current_date
        ) as overdue_tasks
    `,
    params
  );

  return {
    ...rows[0],
    new_notifications: 0
  };
}

async function getAnalystPriorities(user) {
  const params = [user.id, user.registration, user.name];
  const { rows } = await getPool().query(
    `
      with my_contracts as (
        select distinct c.*
        from contracts c
        join contract_responsibles cr on cr.contract_id = c.id
        where ${analystResponsibleCondition('cr')}
      ),
      enriched as (
        select
          c.id,
          c.contract_key,
          c.supplier_name,
          c.end_date,
          c.current_balance,
          case
            when coalesce(c.updated_value, c.initial_value) > 0
            then round((coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100, 2)
            else null
          end as balance_percentage,
          t.title as task_title,
          t.status as task_status,
          case
            when c.end_date < current_date then 'VENCIDO'
            when c.end_date <= current_date + interval '30 days' then 'VENCE_30'
            when coalesce(c.updated_value, c.initial_value) > 0
              and (coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100 <= 10 then 'SALDO_CRITICO'
            when t.due_date < current_date then 'PENDENCIA_ATRASADA'
            when t.id is not null then 'PENDENCIA'
            else 'ACOMPANHAR'
          end as situation,
          least(
            coalesce(c.end_date, current_date + interval '999 days'),
            coalesce(t.due_date, current_date + interval '999 days')
          ) as priority_date
        from my_contracts c
        left join lateral (
          select *
          from contract_tasks ct
          where ct.contract_id = c.id
            and ct.status in ('PENDENTE', 'EM_ANDAMENTO')
          order by
            case ct.priority
              when 'URGENTE' then 1
              when 'ALTA' then 2
              when 'NORMAL' then 3
              else 4
            end,
            ct.due_date asc nulls last
          limit 1
        ) t on true
      )
      select *
      from enriched
      where situation <> 'ACOMPANHAR'
      order by
        case situation
          when 'VENCIDO' then 1
          when 'PENDENCIA_ATRASADA' then 2
          when 'VENCE_30' then 3
          when 'SALDO_CRITICO' then 4
          when 'PENDENCIA' then 5
          else 6
        end,
        priority_date asc nulls last
      limit 12
    `,
    params
  );

  return rows;
}

async function getExpirationBuckets(user) {
  const params = [user.id, user.registration, user.name];
  const { rows } = await getPool().query(
    `
      with my_contracts as (
        select distinct c.*
        from contracts c
        join contract_responsibles cr on cr.contract_id = c.id
        where ${analystResponsibleCondition('cr')}
      )
      select
        count(*) filter (
          where end_date between current_date and current_date + interval '30 days'
        )::int as days_0_30,
        count(*) filter (
          where end_date > current_date + interval '30 days'
            and end_date <= current_date + interval '60 days'
        )::int as days_31_60,
        count(*) filter (
          where end_date > current_date + interval '60 days'
            and end_date <= current_date + interval '90 days'
        )::int as days_61_90
      from my_contracts
      where status = 'ATIVO'
    `,
    params
  );

  return rows[0];
}

async function getCriticalBalanceContracts(user) {
  const params = [user.id, user.registration, user.name];
  const { rows } = await getPool().query(
    `
      select distinct
        c.id,
        c.contract_key,
        c.supplier_name,
        c.current_balance,
        round((coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100, 2) as balance_percentage
      from contracts c
      join contract_responsibles cr on cr.contract_id = c.id
      where ${analystResponsibleCondition('cr')}
        and coalesce(c.updated_value, c.initial_value) > 0
        and (coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100 <= 10
      order by balance_percentage asc, c.supplier_name asc
      limit 8
    `,
    params
  );

  return rows;
}

async function getManagementMetrics() {
  const { rows } = await getPool().query(
    `
      with contract_balance as (
        select
          id,
          created_at,
          status,
          end_date,
          coalesce(updated_value, initial_value) as effective_value,
          coalesce(current_balance, 0) as current_balance,
          case
            when coalesce(updated_value, initial_value) > 0
            then (coalesce(current_balance, 0) / coalesce(updated_value, initial_value)) * 100
            else null
          end as balance_percentage
        from contracts
      )
      select
        count(*)::int as total_contracts,
        count(*) filter (where status = 'ATIVO')::int as active_contracts,
        count(*) filter (
          where status = 'ATIVO'
            and end_date between current_date and current_date + interval '90 days'
        )::int as expiring_90_days,
        count(*) filter (
          where status = 'ATIVO'
            and end_date between current_date and current_date + interval '30 days'
        )::int as expiring_30_days,
        count(*) filter (where balance_percentage <= 30)::int as balance_warning_contracts,
        count(*) filter (where balance_percentage <= 10)::int as balance_critical_contracts,
        count(*) filter (where created_at >= now() - interval '30 days')::int as new_contracts,
        coalesce(sum(effective_value), 0)::numeric(14, 2) as total_contract_value,
        coalesce(sum(current_balance), 0)::numeric(14, 2) as total_available_balance,
        (
          select count(*)::int
          from contract_tasks
          where status in ('PENDENTE', 'EM_ANDAMENTO')
        ) as pending_tasks
      from contract_balance
    `
  );

  return rows[0];
}

async function queryChart(sql) {
  const { rows } = await getPool().query(sql);
  return rows;
}

async function getManagementCharts() {
  const [
    byStatus,
    byUnit,
    byAnalyst,
    byExpirationRange,
    byBalanceRange,
    byNewContracts
  ] = await Promise.all([
    queryChart(`
      select status as label, count(*)::int as value
      from contracts
      group by status
      order by value desc, label asc
    `),
    queryChart(`
      with unit_counts as (
        select coalesce(unit, 'Sem unidade') as label, count(*)::int as value
        from contracts
        group by coalesce(unit, 'Sem unidade')
      ),
      ranked as (
        select
          label,
          value,
          row_number() over (order by value desc, label asc) as position
        from unit_counts
      )
      select
        case when position <= 7 then label else 'Outras' end as label,
        sum(value)::int as value
      from ranked
      group by case when position <= 7 then label else 'Outras' end
      order by sum(value) desc, label asc
    `),
    queryChart(`
      select coalesce(u.full_name, cr.name) as label, count(distinct c.id)::int as value
      from contracts c
      join contract_responsibles cr on cr.contract_id = c.id
        and cr.active = true
        and cr.role = 'ANALISTA'
      left join users u on u.id = cr.user_id
      where coalesce(u.full_name, cr.name) is not null
      group by coalesce(u.full_name, cr.name)
      order by value desc, label asc
      limit 8
    `),
    queryChart(`
      select label, value
      from (
        select 'Vencidos' as label, count(*) filter (where end_date < current_date)::int as value, 1 as sort_order from contracts
        union all
        select '0-30 dias', count(*) filter (where end_date between current_date and current_date + interval '30 days')::int, 2 from contracts
        union all
        select '31-60 dias', count(*) filter (where end_date > current_date + interval '30 days' and end_date <= current_date + interval '60 days')::int, 3 from contracts
        union all
        select '61-90 dias', count(*) filter (where end_date > current_date + interval '60 days' and end_date <= current_date + interval '90 days')::int, 4 from contracts
        union all
        select 'Acima de 90 dias', count(*) filter (where end_date > current_date + interval '90 days')::int, 5 from contracts
      ) buckets
      order by sort_order asc
    `),
    queryChart(`
      with balances as (
        select
          case
            when coalesce(updated_value, initial_value) > 0
            then (coalesce(current_balance, 0) / coalesce(updated_value, initial_value)) * 100
            else null
          end as balance_percentage
        from contracts
      )
      select label, value
      from (
        select 'Critico <= 10%' as label, count(*) filter (where balance_percentage <= 10)::int as value, 1 as sort_order from balances
        union all
        select 'Atencao 11-30%', count(*) filter (where balance_percentage > 10 and balance_percentage <= 30)::int, 2 from balances
        union all
        select 'Normal > 30%', count(*) filter (where balance_percentage > 30)::int, 3 from balances
        union all
        select 'Sem valor', count(*) filter (where balance_percentage is null)::int, 4 from balances
      ) buckets
      order by sort_order asc
    `),
    queryChart(`
      select label, value
      from (
        select 'Ultimos 30 dias' as label, count(*) filter (where created_at >= now() - interval '30 days')::int as value, 1 as sort_order from contracts
        union all
        select 'Anteriores', count(*) filter (where created_at < now() - interval '30 days')::int, 2 from contracts
      ) buckets
      order by sort_order asc
    `)
  ]);

  return {
    byStatus,
    byUnit,
    byAnalyst,
    byExpirationRange,
    byBalanceRange,
    byNewContracts
  };
}

async function getTvCharts() {
  const [byStatus, byUnit] = await Promise.all([
    queryChart(`
      select status as label, count(*)::int as value
      from contracts
      group by status
      order by value desc, label asc
    `),
    queryChart(`
      select coalesce(unit, 'Sem unidade') as label, count(*)::int as value
      from contracts
      group by coalesce(unit, 'Sem unidade')
      order by value desc, label asc
      limit 6
    `)
  ]);

  return {
    byStatus,
    byUnit
  };
}

async function getManagementExpiringContracts() {
  const { rows } = await getPool().query(
    `
      select
        id,
        contract_key,
        supplier_name,
        unit,
        end_date,
        coalesce(updated_value, initial_value) as effective_value
      from contracts
      where status = 'ATIVO'
        and end_date between current_date and current_date + interval '90 days'
      order by end_date asc, supplier_name asc
      limit 10
    `
  );

  return rows;
}

async function getManagementCriticalBalanceContracts() {
  const { rows } = await getPool().query(
    `
      select
        id,
        contract_key,
        supplier_name,
        unit,
        current_balance,
        round((coalesce(current_balance, 0) / coalesce(updated_value, initial_value)) * 100, 2) as balance_percentage
      from contracts
      where coalesce(updated_value, initial_value) > 0
        and (coalesce(current_balance, 0) / coalesce(updated_value, initial_value)) * 100 <= 30
      order by balance_percentage asc, supplier_name asc
      limit 10
    `
  );

  return rows;
}

async function getLatestCompletedImport() {
  const { rows } = await getPool().query(
    `
      select
        id,
        filename,
        user_id,
        total_rows,
        new_records,
        updated_records,
        error_records,
        coalesce(finished_at, updated_at, created_at) as last_update_at
      from contract_imports
      where status = 'COMPLETED'
      order by coalesce(finished_at, updated_at, created_at) desc
      limit 1
    `
  );

  return rows[0] || null;
}

module.exports = {
  getAnalystMetrics,
  getAnalystPriorities,
  getExpirationBuckets,
  getCriticalBalanceContracts,
  getManagementMetrics,
  getManagementCharts,
  getTvCharts,
  getManagementExpiringContracts,
  getManagementCriticalBalanceContracts,
  getLatestCompletedImport
};
