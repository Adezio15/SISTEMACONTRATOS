const userRepository = require('../repositories/userRepository');
const { hasDatabaseConfig } = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/password');

function validateCreateUser(input) {
  const requiredFields = ['fullName', 'registration', 'email', 'roleId', 'password'];
  const missing = requiredFields.filter((field) => !input[field]);

  if (missing.length > 0) {
    return 'Preencha todos os campos obrigatorios.';
  }

  if (input.password.length < 8) {
    return 'A senha deve possuir pelo menos 8 caracteres.';
  }

  return null;
}

async function listUsers() {
  if (!hasDatabaseConfig()) {
    return [
      {
        id: 'local-dev-user',
        full_name: process.env.LOCAL_USER_NAME || 'Usuario Local',
        registration: process.env.LOCAL_USER_REGISTRATION || 'local',
        email: process.env.LOCAL_USER_EMAIL || 'local@sesc-rn.local',
        position: process.env.LOCAL_USER_POSITION || 'Administrador Local',
        active: true,
        role_name: 'Administrador Local',
        role_key: 'ADMINISTRADOR'
      }
    ];
  }

  return userRepository.listUsers();
}

async function createUser(input) {
  if (!hasDatabaseConfig()) {
    return {
      ok: false,
      message: 'Modo local demo: configure DATABASE_URL para cadastrar usuarios.'
    };
  }

  const validationMessage = validateCreateUser(input);

  if (validationMessage) {
    return {
      ok: false,
      message: validationMessage
    };
  }

  const existing = await userRepository.findByRegistration(input.registration);

  if (existing) {
    return {
      ok: false,
      message: 'Ja existe usuario com esta matricula.'
    };
  }

  const passwordHash = await hashPassword(input.password);

  await userRepository.createUser({
    fullName: input.fullName.trim(),
    registration: input.registration.trim(),
    email: input.email.trim().toLowerCase(),
    position: input.position?.trim() || null,
    roleId: input.roleId,
    passwordHash,
    active: input.active !== 'false'
  });

  return {
    ok: true,
    message: 'Usuario criado com sucesso.'
  };
}

async function changePassword({ userId, currentPassword, newPassword }) {
  if (!hasDatabaseConfig()) {
    return {
      ok: false,
      message: 'Modo local demo: altere LOCAL_USER_PASSWORD no .env.'
    };
  }

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return {
      ok: false,
      message: 'Informe a senha atual e uma nova senha com pelo menos 8 caracteres.'
    };
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    return {
      ok: false,
      message: 'Usuario nao encontrado.'
    };
  }

  const matches = await verifyPassword(currentPassword, user.password_hash);

  if (!matches) {
    return {
      ok: false,
      message: 'Senha atual invalida.'
    };
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, passwordHash);

  return {
    ok: true,
    message: 'Senha alterada com sucesso.'
  };
}

module.exports = {
  listUsers,
  createUser,
  changePassword
};
