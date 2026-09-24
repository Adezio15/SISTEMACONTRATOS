const { getPool } = require('../config/database');

async function getDatabaseHealth() {
  const startedAt = Date.now();
  const { rows } = await getPool().query('select now() as checked_at');

  return {
    ok: true,
    checkedAt: rows[0].checked_at,
    latencyMs: Date.now() - startedAt
  };
}

async function getBaseHealth() {
  const { rows } = await getPool().query(
    `
      select
        (select count(*)::int from contracts) as total_contracts,
        (select count(*)::int from contracts where status = 'ATIVO') as active_contracts,
        (select count(*)::int from contract_imports) as total_imports,
        (
          select json_build_object(
            'id', ci.id,
            'filename', ci.filename,
            'status', ci.status,
            'user_name', u.full_name,
            'total_rows', ci.total_rows,
            'new_records', ci.new_records,
            'updated_records', ci.updated_records,
            'error_records', ci.error_records,
            'created_at', ci.created_at,
            'finished_at', ci.finished_at
          )
          from contract_imports ci
          left join users u on u.id = ci.user_id
          order by coalesce(ci.finished_at, ci.updated_at, ci.created_at) desc
          limit 1
        ) as latest_import
    `
  );

  return rows[0];
}

module.exports = {
  getDatabaseHealth,
  getBaseHealth
};
