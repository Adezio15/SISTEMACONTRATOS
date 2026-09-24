const notificationService = require('../services/notificationService');
const { formatDateTime } = require('../utils/time');

async function index(req, res, next) {
  try {
    const data = await notificationService.listUserNotifications(req.session.user.id);

    res.render('notifications/index', {
      title: 'Notificacoes',
      ...data,
      formatDateTime
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.session.user.id, req.params.id);
    res.redirect('/notificacoes');
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.session.user.id);
    res.redirect('/notificacoes');
  } catch (error) {
    next(error);
  }
}

async function apiList(req, res, next) {
  try {
    const data = await notificationService.listUserNotifications(req.session.user.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  markAsRead,
  markAllAsRead,
  apiList
};
