const { getPool } = require('../config/database');

async function findByRegistration(registration) {
  const { rows } = await getPool().query(
    'select * from users where registration = $1 limit 1',
    [registration]
  );

  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await getPool().query(
    'select * from users where id = $1 limit 1',
    [id]
  );

  return rows[0] || null;
}

async function findByRegistrationWithRole(registration) {
  const { rows } = await getPool().query(
    `
      select
        u.*,
        r.key as role_key,
        r.name as role_name,
        coalesce(array_agg(p.key) filter (where p.key is not null), '{}') as permissions
      from users u
      join roles r on r.id = u.role_id
      left join role_permissions rp on rp.role_id = r.id
      left join permissions p on p.id = rp.permission_id
      where u.registration = $1
      group by u.id, r.id
      limit 1
    `,
    [registration]
  );

  return rows[0] || null;
}

async function listUsers() {
  const { rows } = await getPool().query(
    `
      select
        u.id,
        u.full_name,
        u.registration,
        u.email,
        u.position,
        u.active,
        u.created_at,
        r.name as role_name,
        r.key as role_key
      from users u
      join roles r on r.id = u.role_id
      order by u.full_name asc
    `
  );

  return rows;
}

async function createUser(user) {
  const { rows } = await getPool().query(
    `
      insert into users (
        full_name,
        registration,
        email,
        position,
        role_id,
        password_hash,
        active
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id
    `,
    [
      user.fullName,
      user.registration,
      user.email,
      user.position,
      user.roleId,
      user.passwordHash,
      user.active
    ]
  );

  return rows[0];
}

async function updatePassword(userId, passwordHash) {
  await getPool().query(
    'update users set password_hash = $2, updated_at = now() where id = $1',
    [userId, passwordHash]
  );
}

module.exports = {
  findByRegistration,
  findById,
  findByRegistrationWithRole,
  listUsers,
  createUser,
  updatePassword
};
