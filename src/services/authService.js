const userRepository = require('../repositories/userRepository');
const { hasDatabaseConfig } = require('../config/database');
const { verifyPassword } = require('../utils/password');

const localPermissions = [
  'users.manage',
  'contracts.view',
  'contracts.manage',
  'imports.manage',
  'reports.view',
  'dashboards.view',
  'settings.manage',
  'tv.view'
];

function tryLocalLogin({ registration, password }) {
  const localRegistration = process.env.LOCAL_USER_REGISTRATION || 'local';
  const localPassword = process.env.LOCAL_USER_PASSWORD || 'Local@123456';

  if (registration.trim() !== localRegistration || password !== localPassword) {
    return {
      ok: false,
      message: 'Credenciais invalidas ou usuario inativo.'
    };
  }

  return {
    ok: true,
    user: {
      id: 'local-dev-user',
      name: process.env.LOCAL_USER_NAME || 'Usuario Local',
      registration: localRegistration,
      email: process.env.LOCAL_USER_EMAIL || 'local@sesc-rn.local',
      roleKey: 'ADMINISTRADOR',
      roleName: 'Administrador Local',
      permissions: localPermissions,
      localMode: true
    }
  };
}

async function login({ registration, password }) {
  if (!registration || !password) {
    return {
      ok: false,
      message: 'Informe matricula e senha.'
    };
  }

  if (!hasDatabaseConfig()) {
    return tryLocalLogin({ registration, password });
  }

  const user = await userRepository.findByRegistrationWithRole(registration.trim());

  if (!user || !user.active) {
    return {
      ok: false,
      message: 'Credenciais invalidas ou usuario inativo.'
    };
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);

  if (!passwordMatches) {
    return {
      ok: false,
      message: 'Credenciais invalidas ou usuario inativo.'
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.full_name,
      registration: user.registration,
      email: user.email,
      roleKey: user.role_key,
      roleName: user.role_name,
      permissions: user.permissions || []
    }
  };
}

module.exports = { login };
