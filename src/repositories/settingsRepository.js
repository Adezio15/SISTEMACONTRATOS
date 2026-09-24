const { getPool } = require('../config/database');

async function listSettings() {
  const { rows } = await getPool().query(
    'select * from system_settings order by key asc'
  );

  return rows;
}

async function updateSetting(key, value) {
  await getPool().query(
    'update system_settings set value = $2, updated_at = now() where key = $1',
    [key, value]
  );
}

module.exports = {
  listSettings,
  updateSetting
};
