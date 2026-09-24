const { getPool } = require('../config/database');

async function listTasks(filters = {}) {
  const params = [];
  const conditions = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`ct.status = $${params.length}`);
  }

  if (filters.responsibleUserId) {
    params.push(filters.responsibleUserId);
    conditions.push(`ct.responsible_user_id = $${params.length}`);
  }

  if (filters.contractId) {
    params.push(filters.contractId);
    conditions.push(`ct.contract_id = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const { rows } = await getPool().query(
    `
      select
        ct.*,
        c.contract_key,
        c.supplier_name,
        u.full_name as responsible_name
      from contract_tasks ct
      join contracts c on c.id = ct.contract_id
      left join users u on u.id = ct.responsible_user_id
      ${where}
      order by
        case ct.priority
          when 'URGENTE' then 1
          when 'ALTA' then 2
          when 'NORMAL' then 3
          else 4
        end,
        ct.due_date asc nulls last,
        ct.created_at desc
    `,
    params
  );

  return rows;
}

async function createTask(task) {
  await getPool().query(
    `
      insert into contract_tasks (
        contract_id,
        title,
        description,
        responsible_user_id,
        created_by_user_id,
        due_date,
        priority,
        status,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, 'PENDENTE', $8)
    `,
    [
      task.contractId,
      task.title,
      task.description,
      task.responsibleUserId,
      task.createdByUserId,
      task.dueDate,
      task.priority,
      task.notes
    ]
  );
}

async function updateTaskStatus(taskId, status, userId) {
  await getPool().query(
    `
      update contract_tasks
      set status = $2,
          updated_at = now()
      where id = $1
        and (
          responsible_user_id = $3
          or $3 in (
            select u.id
            from users u
            join roles r on r.id = u.role_id
            where r.key = 'ADMINISTRADOR'
          )
        )
    `,
    [taskId, status, userId]
  );
}

module.exports = {
  listTasks,
  createTask,
  updateTaskStatus
};
