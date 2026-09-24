const roleRepository = require('../repositories/roleRepository');
const { hasDatabaseConfig } = require('../config/database');

async function listRoles() {
  if (!hasDatabaseConfig()) {
    return [
      {
        id: 'ADMINISTRADOR',
        key: 'ADMINISTRADOR',
        name: 'Administrador'
      }
    ];
  }

  return roleRepository.listRoles();
}

module.exports = { listRoles };
