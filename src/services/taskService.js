const taskRepository = require('../repositories/taskRepository');
const { hasDatabaseConfig } = require('../config/database');
const { getDemoTasks } = require('../data/localDemoData');

async function listTasks(filters) {
  if (!hasDatabaseConfig()) {
    return getDemoTasks(filters);
  }

  return taskRepository.listTasks(filters);
}

async function createTask(input) {
  if (!hasDatabaseConfig()) {
    return { ok: false, message: 'Modo local demo: configure DATABASE_URL para gravar pendencias.' };
  }

  if (!input.contractId || !input.title) {
    return { ok: false, message: 'Contrato e titulo sao obrigatorios.' };
  }

  await taskRepository.createTask({
    contractId: input.contractId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    responsibleUserId: input.responsibleUserId || null,
    createdByUserId: input.createdByUserId,
    dueDate: input.dueDate || null,
    priority: input.priority || 'NORMAL',
    notes: input.notes?.trim() || null
  });

  return { ok: true, message: 'Pendencia criada com sucesso.' };
}

async function updateTaskStatus({ taskId, status, userId }) {
  if (!hasDatabaseConfig()) {
    return;
  }

  await taskRepository.updateTaskStatus(taskId, status, userId);
}

module.exports = {
  listTasks,
  createTask,
  updateTaskStatus
};
