const taskService = require('../services/taskService');
const { setFlash } = require('../middlewares/attachLocals');
const { formatDate } = require('../utils/formatters');

async function index(req, res, next) {
  try {
    const filters = {
      status: req.query.status || undefined,
      responsibleUserId: req.query.mine === 'true' ? req.session.user.id : undefined
    };
    const tasks = await taskService.listTasks(filters);

    res.render('tasks/index', {
      title: 'Pendencias',
      tasks,
      filters: req.query,
      formatDate
    });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    await taskService.updateTaskStatus({
      taskId: req.params.id,
      status: req.body.status,
      userId: req.session.user.id
    });

    setFlash(req, 'success', 'Pendencia atualizada.');
    res.redirect('/pendencias');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  updateStatus
};
