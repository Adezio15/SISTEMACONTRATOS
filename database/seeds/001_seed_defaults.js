const { getPool } = require('../../src/config/database');
const { hashPassword } = require('../../src/utils/password');

const roles = [
  ['ADMINISTRADOR', 'Administrador', 'Acesso administrativo completo.'],
  ['GERENCIA', 'Gerencia', 'Acesso gerencial e relatorios.'],
  ['ANALISTA', 'Analista', 'Acesso operacional aos contratos atribuidos.'],
  ['CONSULTA', 'Consulta', 'Acesso somente leitura.'],
  ['TV_GERENCIA', 'TV Gerencia', 'Acesso exclusivo ao dashboard de TV.']
];

const permissions = [
  ['users.manage', 'Gerenciar usuarios', 'Cadastrar, editar, desativar e redefinir usuarios.'],
  ['contracts.view', 'Visualizar contratos', 'Consultar contratos autorizados.'],
  ['contracts.manage', 'Gerenciar contratos', 'Alterar campos autorizados de contratos.'],
  ['imports.manage', 'Importar dados', 'Enviar e confirmar importacoes de planilhas.'],
  ['reports.view', 'Visualizar relatorios', 'Consultar relatorios do sistema.'],
  ['dashboards.view', 'Visualizar dashboards', 'Acessar dashboards internos.'],
  ['settings.manage', 'Gerenciar configuracoes', 'Administrar parametros do sistema.'],
  ['tv.view', 'Visualizar TV', 'Acessar dashboard de TV.']
];

const rolePermissionMap = {
  ADMINISTRADOR: permissions.map(([key]) => key),
  GERENCIA: ['contracts.view', 'reports.view', 'dashboards.view'],
  ANALISTA: ['contracts.view', 'contracts.manage', 'dashboards.view'],
  CONSULTA: ['contracts.view'],
  TV_GERENCIA: ['tv.view']
};

const settings = [
  ['expiration_warning_days', '90', 'Dias para alerta de vencimento.'],
  ['balance_warning_percentage', '30', 'Percentual de saldo para alerta.'],
  ['balance_critical_percentage', '10', 'Percentual de saldo critico.'],
  ['new_contract_days', '30', 'Dias para considerar contrato novo.']
];

async function seed() {
  const pool = getPool({ direct: true });
  const client = await pool.connect();

  try {
    await client.query('begin');

    for (const [key, name, description] of roles) {
      await client.query(
        `
          insert into roles (key, name, description)
          values ($1, $2, $3)
          on conflict (key) do update set
            name = excluded.name,
            description = excluded.description,
            updated_at = now()
        `,
        [key, name, description]
      );
    }

    for (const [key, name, description] of permissions) {
      await client.query(
        `
          insert into permissions (key, name, description)
          values ($1, $2, $3)
          on conflict (key) do update set
            name = excluded.name,
            description = excluded.description
        `,
        [key, name, description]
      );
    }

    for (const [roleKey, permissionKeys] of Object.entries(rolePermissionMap)) {
      for (const permissionKey of permissionKeys) {
        await client.query(
          `
            insert into role_permissions (role_id, permission_id)
            select r.id, p.id
            from roles r
            cross join permissions p
            where r.key = $1 and p.key = $2
            on conflict do nothing
          `,
          [roleKey, permissionKey]
        );
      }
    }

    for (const [key, value, description] of settings) {
      await client.query(
        `
          insert into system_settings (key, value, description)
          values ($1, $2, $3)
          on conflict (key) do update set
            value = excluded.value,
            description = excluded.description,
            updated_at = now()
        `,
        [key, value, description]
      );
    }

    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
    const adminHash = await hashPassword(adminPassword);

    await client.query(
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
        where r.key = 'ADMINISTRADOR'
        on conflict (registration) do nothing
      `,
      [
        process.env.SEED_ADMIN_NAME || 'Administrador do Sistema',
        process.env.SEED_ADMIN_REGISTRATION || 'admin',
        process.env.SEED_ADMIN_EMAIL || 'admin@sesc-rn.local',
        'Administrador',
        adminHash
      ]
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { seed };
