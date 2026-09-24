require('dotenv').config();

const { getPool, directPool } = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');

const user = {
  fullName: process.env.LOCAL_USER_NAME || 'Usuario Local',
  registration: process.env.LOCAL_USER_REGISTRATION || 'local',
  email: process.env.LOCAL_USER_EMAIL || 'local@sesc-rn.local',
  position: process.env.LOCAL_USER_POSITION || 'Administrador Local',
  roleKey: process.env.LOCAL_USER_ROLE || 'ADMINISTRADOR',
  password: process.env.LOCAL_USER_PASSWORD || 'Local@123456'
};

async function createLocalUser() {
  const pool = getPool({ direct: true });
  const passwordHash = await hashPassword(user.password);

  await pool.query(
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
      select
        $1,
        $2,
        $3,
        $4,
        r.id,
        $5,
        true
      from roles r
      where r.key = $6
      on conflict (registration) do update set
        full_name = excluded.full_name,
        email = excluded.email,
        position = excluded.position,
        role_id = excluded.role_id,
        password_hash = excluded.password_hash,
        active = true,
        updated_at = now()
    `,
    [
      user.fullName,
      user.registration,
      user.email,
      user.position,
      passwordHash,
      user.roleKey
    ]
  );

  console.log('Usuario local criado/atualizado:');
  console.log(`Matricula: ${user.registration}`);
  console.log(`Senha: ${user.password}`);
  console.log(`Perfil: ${user.roleKey}`);
}

createLocalUser()
  .then(async () => {
    if (directPool) {
      await directPool.end();
    }
  })
  .catch(async (error) => {
    console.error(error);
    if (directPool) {
      await directPool.end();
    }
    process.exit(1);
  });
