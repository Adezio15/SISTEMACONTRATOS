const healthRepository = require('../repositories/healthRepository');

async function getReadiness() {
  return healthRepository.getDatabaseHealth();
}

async function getBaseHealth() {
  return healthRepository.getBaseHealth();
}

module.exports = {
  getReadiness,
  getBaseHealth
};
