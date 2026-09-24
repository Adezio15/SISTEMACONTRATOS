require('dotenv').config();

const { createApp } = require('./app');
const { logger } = require('./config/logger');
const { startJobs } = require('./jobs');

const port = process.env.PORT || 3000;
const app = createApp();

app.listen(port, () => {
  logger.info(`Sistema de Contratos iniciado na porta ${port}`);
  startJobs();
});
