const { getPool } = require('../config/database');

async function listNotes(contractId) {
  const { rows } = await getPool().query(
    `
      select
        cn.*,
        u.full_name as user_name
      from contract_notes cn
      left join users u on u.id = cn.user_id
      where cn.contract_id = $1
      order by cn.created_at desc
    `,
    [contractId]
  );

  return rows;
}

async function createNote({ contractId, userId, note }) {
  await getPool().query(
    `
      insert into contract_notes (contract_id, user_id, note)
      values ($1, $2, $3)
    `,
    [contractId, userId, note]
  );
}

module.exports = {
  listNotes,
  createNote
};
