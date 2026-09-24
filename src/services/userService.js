const userRepository = require('../repositories/userRepository');
const { hasDatabaseConfig } = require('../config/database');
const { sendNotificationEmail, isEmailConfigured } = require('./emailService');
const { hashPassword, verifyPassword } = require('../utils/password');
const crypto = require('crypto');

function validateUserFields(input, { requirePassword = false } = {}) {
  const requiredFields = ['fullName', 'registration', 'email', 'roleId'];
  const missing = requiredFields.filter((field) => !input[field]);

  if (missing.length > 0) {
    return 'Preencha todos os campos obrigatorios.';
  }

  if (!input.email.includes('@')) {
    return 'Informe um e-mail valido.';
  }

  if (requirePassword && (!input.password || input.password.length < 8)) {
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

  const validationMessage = validateUserFields(input, { requirePassword: true });

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

async function getUser(userId) {
  if (!hasDatabaseConfig()) {
    return {
      id: 'local-dev-user',
      full_name: process.env.LOCAL_USER_NAME || 'Usuario Local',
      registration: process.env.LOCAL_USER_REGISTRATION || 'local',
      email: process.env.LOCAL_USER_EMAIL || 'local@sesc-rn.local',
      position: process.env.LOCAL_USER_POSITION || 'Administrador Local',
      role_id: 'ADMINISTRADOR',
      active: true
    };
  }

  return userRepository.findByIdWithRole(userId);
}

async function updateUser(userId, input) {
  if (!hasDatabaseConfig()) {
    return {
      ok: false,
      message: 'Modo local demo: configure DATABASE_URL para editar usuarios.'
    };
  }

  const validationMessage = validateUserFields(input);

  if (validationMessage) {
    return {
      ok: false,
      message: validationMessage
    };
  }

  const currentUser = await userRepository.findById(userId);

  if (!currentUser) {
    return {
      ok: false,
      message: 'Usuario nao encontrado.'
    };
  }

  const registrationOwner = await userRepository.findByRegistration(input.registration.trim());

  if (registrationOwner && registrationOwner.id !== userId) {
    return {
      ok: false,
      message: 'Ja existe outro usuario com esta matricula.'
    };
  }

  const emailOwner = await userRepository.findByEmail(input.email.trim());

  if (emailOwner && emailOwner.id !== userId) {
    return {
      ok: false,
      message: 'Ja existe outro usuario com este e-mail.'
    };
  }

  await userRepository.updateUser(userId, {
    fullName: input.fullName.trim(),
    registration: input.registration.trim(),
    email: input.email.trim().toLowerCase(),
    position: input.position?.trim() || null,
    roleId: input.roleId,
    active: input.active === 'true' || input.active === 'on'
  });

  return {
    ok: true,
    message: 'Usuario atualizado com sucesso.'
  };
}

async function resetPassword({ userId, newPassword }) {
  if (!hasDatabaseConfig()) {
    return {
      ok: false,
      message: 'Modo local demo: altere LOCAL_USER_PASSWORD no .env.'
    };
  }

  if (!newPassword || newPassword.length < 8) {
    return {
      ok: false,
      message: 'Informe uma senha com pelo menos 8 caracteres.'
    };
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    return {
      ok: false,
      message: 'Usuario nao encontrado.'
    };
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, passwordHash);

  return {
    ok: true,
    message: 'Senha redefinida com sucesso.'
  };
}

function generateTemporaryPassword() {
  const random = crypto.randomBytes(6).toString('base64url');
  return `Sesc@${random}1`;
}

async function requestPasswordReset({ registration }) {
  if (!hasDatabaseConfig()) {
    return {
      ok: false,
      message: 'Modo local demo: altere LOCAL_USER_PASSWORD no .env.'
    };
  }

  if (!isEmailConfigured()) {
    return {
      ok: false,
      message: 'SMTP nao configurado. Solicite a redefinicao ao administrador.'
    };
  }

  if (!registration) {
    return {
      ok: false,
      message: 'Informe a matricula.'
    };
  }

  const user = await userRepository.findByRegistration(registration.trim());

  if (!user || !user.active) {
    return {
      ok: true,
      message: 'Se a matricula estiver ativa, as instrucoes serao enviadas por e-mail.'
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  await userRepository.updatePassword(user.id, await hashPassword(temporaryPassword));
  await sendNotificationEmail({
    to: user.email,
    subject: 'Redefinicao de senha - Sistema de Contratos',
    message: `Sua senha temporaria e: ${temporaryPassword}\nAltere a senha apos o proximo acesso.`,
    linkUrl: '/login'
  });

  return {
    ok: true,
    message: 'Se a matricula estiver ativa, as instrucoes serao enviadas por e-mail.'
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
  getUser,
  updateUser,
  resetPassword,
  requestPasswordReset,
  changePassword
};
