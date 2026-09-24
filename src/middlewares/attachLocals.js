const notificationService = require('../services/notificationService');
const { hasDatabaseConfig } = require('../config/database');

async function attachLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  res.locals.unreadNotifications = 0;
  delete req.session.flash;

  if (!req.session.user || !hasDatabaseConfig()) {
    return next();
  }

  try {
    res.locals.unreadNotifications = await notificationService.countUnread(req.session.user.id);
    return next();
  } catch (error) {
    return next(error);
  }
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

module.exports = {
  attachLocals,
  setFlash
};
