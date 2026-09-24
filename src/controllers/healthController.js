const healthService = require('../services/healthService');
const { formatDateTime } = require('../utils/time');

async function healthz(req, res) {
  res.json({
    ok: true,
    service: 'sistema-contratos-sesc-rn',
    timestamp: new Date().toISOString()
  });
}

async function readyz(req, res, next) {
  try {
    const health = await healthService.getReadiness();
    res.json(health);
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: 'database_unavailable'
    });
  }
}

async function baseHealth(req, res, next) {
  try {
    const health = await healthService.getBaseHealth();

    res.render('health/base', {
      title: 'Saude da Base',
      health,
      formatDateTime
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  healthz,
  readyz,
  baseHealth
};
