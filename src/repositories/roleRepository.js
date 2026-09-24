const { getPool } = require('../config/database');

async function listRoles() {
  const { rows } = await getPool().query(
    'select id, key, name from roles order by name asc'
  );

  return rows;
}

module.exports = { listRoles };
