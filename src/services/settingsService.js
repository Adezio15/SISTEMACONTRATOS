const settingsRepository = require('../repositories/settingsRepository');
const { hasDatabaseConfig } = require('../config/database');
const { demoSettings } = require('../data/localDemoData');

async function listSettings() {
  if (!hasDatabaseConfig()) {
    return demoSettings;
  }

  return settingsRepository.listSettings();
}

async function updateSettings(settings) {
  if (!hasDatabaseConfig()) {
    return;
  }

  for (const [key, value] of Object.entries(settings)) {
    await settingsRepository.updateSetting(key, value);
  }
}

module.exports = {
  listSettings,
  updateSettings
};
