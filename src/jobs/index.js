const cron = require('node-cron');
const { logger } = require('../config/logger');
const { runContractExpirationJob } = require('./contractExpirationJob');
const { runContractBalanceJob } = require('./contractBalanceJob');
const { runNotificationJob } = require('./notificationJob');

function scheduleJob(expression, name, job) {
  return cron.schedule(expression, async () => {
    try {
      await job();
    } catch (error) {
      logger.error(`Falha no job ${name}.`, {
        error: error.message
      });
    }
  }, {
    timezone: process.env.TZ || 'America/Fortaleza'
  });
}

function startJobs() {
  if (process.env.JOBS_ENABLED === 'false') {
    logger.info('Jobs automaticos desativados por JOBS_ENABLED=false.');
    return [];
  }

  const jobs = [
    scheduleJob('0 7 * * *', 'contractExpirationJob', runContractExpirationJob),
    scheduleJob('15 7 * * *', 'contractBalanceJob', runContractBalanceJob),
    scheduleJob('*/15 * * * *', 'notificationJob', runNotificationJob)
  ];

  logger.info('Jobs automaticos agendados.');
  return jobs;
}

module.exports = {
  startJobs,
  runContractExpirationJob,
  runContractBalanceJob,
  runNotificationJob
};
