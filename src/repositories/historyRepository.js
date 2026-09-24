const { getPool } = require('../config/database');

async function listHistory(contractId) {
  const { rows } = await getPool().query(
    `
      select
        ch.*,
        u.full_name as user_name
      from contract_history ch
      left join users u on u.id = ch.user_id
      where ch.contract_id = $1
      order by ch.created_at desc
      limit 100
    `,
    [contractId]
  );

  return rows;
}

module.exports = { listHistory };
