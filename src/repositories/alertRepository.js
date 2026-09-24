const { getPool } = require('../config/database');

async function listContractsForExpirationAlerts() {
  const { rows } = await getPool().query(
    `
      select
        id,
        contract_key,
        supplier_name,
        end_date,
        (end_date - current_date)::int as days_until_expiration
      from contracts
      where status = 'ATIVO'
        and end_date is not null
        and end_date >= current_date
        and end_date <= current_date + interval '90 days'
      order by end_date asc
    `
  );

  return rows;
}

async function listContractsForBalanceAlerts() {
  const { rows } = await getPool().query(
    `
      select
        id,
        contract_key,
        supplier_name,
        current_balance,
        round((coalesce(current_balance, 0) / coalesce(updated_value, initial_value)) * 100, 2) as balance_percentage
      from contracts
      where coalesce(updated_value, initial_value) > 0
        and (coalesce(current_balance, 0) / coalesce(updated_value, initial_value)) * 100 <= 30
      order by balance_percentage asc, supplier_name asc
    `
  );

  return rows;
}

module.exports = {
  listContractsForExpirationAlerts,
  listContractsForBalanceAlerts
};
