const dashboardRepository = require('../repositories/dashboardRepository');
const { hasDatabaseConfig } = require('../config/database');

function emptyAnalystDashboard() {
  return {
    metrics: {
      my_contracts: 0,
      expiring_contracts: 0,
      critical_balance_contracts: 0,
      pending_tasks: 0,
      overdue_tasks: 0,
      new_notifications: 0
    },
    priorities: [],
    expirationBuckets: {
      days_0_30: 0,
      days_31_60: 0,
      days_61_90: 0
    },
    criticalBalanceContracts: []
  };
}

function emptyManagementDashboard() {
  return {
    metrics: {
      total_contracts: 0,
      active_contracts: 0,
      expiring_90_days: 0,
      expiring_30_days: 0,
      balance_warning_contracts: 0,
      balance_critical_contracts: 0,
      new_contracts: 0,
      total_contract_value: 0,
      total_available_balance: 0,
      total_used_value: 0,
      pending_tasks: 0
    },
    charts: {
      byStatus: [],
      byUnit: [],
      byAnalyst: [],
      byExpirationRange: [],
      byBalanceRange: [],
      byNewContracts: []
    },
    expiringContracts: [],
    criticalBalanceContracts: []
  };
}

async function getAnalystDashboard(user) {
  if (!hasDatabaseConfig()) {
    return emptyAnalystDashboard();
  }

  const [
    metrics,
    priorities,
    expirationBuckets,
    criticalBalanceContracts
  ] = await Promise.all([
    dashboardRepository.getAnalystMetrics(user),
    dashboardRepository.getAnalystPriorities(user),
    dashboardRepository.getExpirationBuckets(user),
    dashboardRepository.getCriticalBalanceContracts(user)
  ]);

  return {
    metrics,
    priorities,
    expirationBuckets,
    criticalBalanceContracts
  };
}

async function getManagementDashboard() {
  if (!hasDatabaseConfig()) {
    return emptyManagementDashboard();
  }

  const [
    metrics,
    charts,
    expiringContracts,
    criticalBalanceContracts
  ] = await Promise.all([
    dashboardRepository.getManagementMetrics(),
    dashboardRepository.getManagementCharts(),
    dashboardRepository.getManagementExpiringContracts(),
    dashboardRepository.getManagementCriticalBalanceContracts()
  ]);

  return {
    metrics: {
      ...metrics,
      total_used_value: Number(metrics.total_contract_value || 0) - Number(metrics.total_available_balance || 0)
    },
    charts,
    expiringContracts,
    criticalBalanceContracts
  };
}

async function getTvDashboard() {
  if (!hasDatabaseConfig()) {
    return {
      ...emptyManagementDashboard(),
      latestImport: null,
      generatedAt: new Date().toISOString()
    };
  }

  const [
    metrics,
    charts,
    expiringContracts,
    criticalBalanceContracts,
    latestImport
  ] = await Promise.all([
    dashboardRepository.getManagementMetrics(),
    dashboardRepository.getTvCharts(),
    dashboardRepository.getManagementExpiringContracts(),
    dashboardRepository.getManagementCriticalBalanceContracts(),
    dashboardRepository.getLatestCompletedImport()
  ]);

  return {
    metrics,
    charts,
    expiringContracts,
    criticalBalanceContracts,
    latestImport,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getAnalystDashboard,
  getManagementDashboard,
  getTvDashboard
};
