const { logger } = require('../config/logger');

function notFoundHandler(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.status(404).render('errors/404', {
    title: 'Pagina nao encontrada'
  });
}

function errorHandler(err, req, res, next) {
  logger.error('Erro nao tratado', {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  if (!req.session.user) {
    return res.status(err.status || 500).send('Nao foi possivel concluir a operacao.');
  }

  return res.status(err.status || 500).render('errors/500', {
    title: 'Erro interno',
    code: err.code || 'APP-001'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
