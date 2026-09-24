const { getPool } = require('../config/database');

const SORT_COLUMNS = {
  contract_key: 'c.contract_key',
  supplier_name: 'c.supplier_name',
  unit: 'c.unit',
  status: 'c.status',
  end_date: 'c.end_date',
  initial_value: 'c.initial_value',
  updated_value: 'coalesce(c.updated_value, c.initial_value)',
  current_balance: 'c.current_balance',
  balance_percentage: `case
    when coalesce(c.updated_value, c.initial_value) > 0
    then (coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100
    else null
  end`,
  created_at: 'c.created_at'
};

function addResponsibleCondition({ conditions, params, role, value }) {
  if (!value) {
    return;
  }

  params.push(`%${value}%`);
  const paramIndex = params.length;

  conditions.push(`exists (
    select 1
    from contract_responsibles cr
    left join users u on u.id = cr.user_id
    where cr.contract_id = c.id
      and cr.active = true
      and cr.role = '${role}'
      and (
        cr.name ilike $${paramIndex}
        or u.full_name ilike $${paramIndex}
      )
  )`);
}

function buildWhere(filters, params) {
  const conditions = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(
      c.contract_key ilike $${params.length}
      or c.supplier_name ilike $${params.length}
      or c.document_number ilike $${params.length}
      or c.object ilike $${params.length}
    )`);
  }

  if (filters.contractNumber) {
    params.push(`%${filters.contractNumber}%`);
    conditions.push(`c.contract_number ilike $${params.length}`);
  }

  if (filters.year !== undefined) {
    params.push(Number(filters.year));
    conditions.push(`c.contract_year = $${params.length}`);
  }

  if (filters.supplier) {
    params.push(`%${filters.supplier}%`);
    conditions.push(`c.supplier_name ilike $${params.length}`);
  }

  if (filters.documentNumber) {
    params.push(`%${filters.documentNumber}%`);
    conditions.push(`c.document_number ilike $${params.length}`);
  }

  if (filters.object) {
    params.push(`%${filters.object}%`);
    conditions.push(`c.object ilike $${params.length}`);
  }

  if (filters.unit) {
    params.push(`%${filters.unit}%`);
    conditions.push(`c.unit ilike $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`c.status = $${params.length}`);
  }

  if (filters.endFrom) {
    params.push(filters.endFrom);
    conditions.push(`c.end_date >= $${params.length}`);
  }

  if (filters.endTo) {
    params.push(filters.endTo);
    conditions.push(`c.end_date <= $${params.length}`);
  }

  if (filters.balanceMin !== undefined) {
    params.push(Number(filters.balanceMin));
    conditions.push(`coalesce(c.current_balance, 0) >= $${params.length}`);
  }

  if (filters.balanceMax !== undefined) {
    params.push(Number(filters.balanceMax));
    conditions.push(`coalesce(c.current_balance, 0) <= $${params.length}`);
  }

  if (filters.balancePercentageMax !== undefined) {
    params.push(Number(filters.balancePercentageMax));
    conditions.push(`
      case
        when coalesce(c.updated_value, c.initial_value) > 0
        then (coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100
        else null
      end <= $${params.length}
    `);
  }

  addResponsibleCondition({
    conditions,
    params,
    role: 'ANALISTA',
    value: filters.analyst
  });

  addResponsibleCondition({
    conditions,
    params,
    role: 'FISCAL',
    value: filters.fiscal
  });

  addResponsibleCondition({
    conditions,
    params,
    role: 'GESTOR',
    value: filters.manager
  });

  if (filters.responsible) {
    params.push(`%${filters.responsible}%`);
    conditions.push(`exists (
      select 1
      from contract_responsibles cr
      left join users u on u.id = cr.user_id
      where cr.contract_id = c.id
        and cr.active = true
        and (
          cr.name ilike $${params.length}
          or u.full_name ilike $${params.length}
        )
    )`);
  }

  return conditions.length ? `where ${conditions.join(' and ')}` : '';
}

function contractSelect() {
  return `
    c.*,
    coalesce(c.updated_value, c.initial_value) as effective_value,
    case
      when coalesce(c.updated_value, c.initial_value) > 0
      then round((coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100, 2)
      else null
    end as balance_percentage,
    coalesce(
      json_agg(
        json_build_object(
          'id', cr.id,
          'role', cr.role,
          'name', coalesce(u.full_name, cr.name),
          'email', coalesce(u.email, cr.email),
          'registration', coalesce(u.registration, cr.registration)
        )
      ) filter (where cr.id is not null),
      '[]'
    ) as responsibles
  `;
}

async function listContracts({ filters, pagination, sort }) {
  const params = [];
  const where = buildWhere(filters, params);
  const sortColumn = SORT_COLUMNS[sort.field] || SORT_COLUMNS.end_date;
  const direction = sort.direction === 'desc' ? 'desc' : 'asc';

  const countResult = await getPool().query(
    `select count(*)::int as total from contracts c ${where}`,
    params
  );

  params.push(pagination.limit);
  const limitParam = params.length;
  params.push(pagination.offset);
  const offsetParam = params.length;

  const { rows } = await getPool().query(
    `
      select ${contractSelect()}
      from contracts c
      left join contract_responsibles cr on cr.contract_id = c.id and cr.active = true
      left join users u on u.id = cr.user_id
      ${where}
      group by c.id
      order by ${sortColumn} ${direction} nulls last, c.contract_key asc
      limit $${limitParam} offset $${offsetParam}
    `,
    params
  );

  return {
    rows,
    total: countResult.rows[0].total
  };
}

async function findContractById(id) {
  const { rows } = await getPool().query(
    `
      select ${contractSelect()}
      from contracts c
      left join contract_responsibles cr on cr.contract_id = c.id and cr.active = true
      left join users u on u.id = cr.user_id
      where c.id = $1
      group by c.id
      limit 1
    `,
    [id]
  );

  return rows[0] || null;
}

async function listResponsibles(contractId) {
  const { rows } = await getPool().query(
    `
      select
        cr.*,
        coalesce(u.full_name, cr.name) as display_name,
        coalesce(u.email, cr.email) as display_email,
        coalesce(u.registration, cr.registration) as display_registration
      from contract_responsibles cr
      left join users u on u.id = cr.user_id
      where cr.contract_id = $1 and cr.active = true
      order by cr.role asc, display_name asc
    `,
    [contractId]
  );

  return rows;
}

async function getFilterOptions() {
  const { rows: years } = await getPool().query(
    'select distinct contract_year from contracts order by contract_year desc'
  );
  const { rows: units } = await getPool().query(
    'select distinct unit from contracts where unit is not null order by unit asc'
  );

  return {
    years: years.map((row) => row.contract_year),
    units: units.map((row) => row.unit)
  };
}

module.exports = {
  listContracts,
  findContractById,
  listResponsibles,
  getFilterOptions
};
