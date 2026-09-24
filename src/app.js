const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { sessionMiddleware } = require('./config/session');
const { attachLocals } = require('./middlewares/attachLocals');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const contractRoutes = require('./routes/contractRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const healthRoutes = require('./routes/healthRoutes');
const importRoutes = require('./routes/importRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const apiRoutes = require('./routes/apiRoutes');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(sessionMiddleware);
  app.use(attachLocals);

  app.use('/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  }));

  app.use(healthRoutes);
  app.use(apiRoutes);

  app.get('/', (req, res) => {
    if (req.session.user) {
      return res.redirect('/dashboard');
    }

    return res.redirect('/login');
  });

  app.use(authRoutes);
  app.use(dashboardRoutes);
  app.use(contractRoutes);
  app.use(importRoutes);
  app.use(notificationRoutes);
  app.use(taskRoutes);
  app.use(reportRoutes);
  app.use(settingsRoutes);
  app.use(userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
