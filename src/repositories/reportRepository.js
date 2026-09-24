const { getPool } = require('../config/database');

async function getContractsReport(filters = {}) {
  const params = [];
  const conditions = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`c.status = $${params.length}`);
  }

  if (filters.unit) {
    params.push(filters.unit);
    conditions.push(`c.unit = $${params.length}`);
  }

  if (filters.analyst) {
    params.push(`%${filters.analyst}%`);
    conditions.push(`exists (
      select 1
      from contract_responsibles cr
      left join users u on u.id = cr.user_id
      where cr.contract_id = c.id
        and cr.role = 'ANALISTA'
        and cr.active = true
        and (cr.name ilike $${params.length} or u.full_name ilike $${params.length})
    )`);
  }

  if (filters.endFrom) {
    params.push(filters.endFrom);
    conditions.push(`c.end_date >= $${params.length}`);
  }

  if (filters.endTo) {
    params.push(filters.endTo);
    conditions.push(`c.end_date <= $${params.length}`);
  }

  if (filters.criticalBalance === 'true') {
    conditions.push(`coalesce(c.updated_value, c.initial_value) > 0`);
    conditions.push(`(coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100 <= 30`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const { rows } = await getPool().query(
    `
      select
        c.contract_key,
        c.contract_year,
        c.supplier_name,
        c.document_number,
        c.object,
        c.unit,
        c.status,
        coalesce(c.updated_value, c.initial_value) as effective_value,
        c.current_balance,
        case
          when coalesce(c.updated_value, c.initial_value) > 0
          then round((coalesce(c.current_balance, 0) / coalesce(c.updated_value, c.initial_value)) * 100, 2)
          else null
        end as balance_percentage,
        c.start_date,
        c.end_date
      from contracts c
      ${where}
      order by c.end_date asc nulls last, c.contract_key asc
      limit 5000
    `,
    params
  );

  return rows;
}

async function getReportOptions() {
  const { rows: units } = await getPool().query(
    'select distinct unit from contracts where unit is not null order by unit asc'
  );

  return {
    units: units.map((row) => row.unit)
  };
}

module.exports = {
  getContractsReport,
  getReportOptions
};
