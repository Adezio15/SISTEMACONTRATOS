const alertRepository = require('../repositories/alertRepository');
const notificationService = require('../services/notificationService');
const {
  buildBalanceEventKey,
  classifyBalanceAlert
} = require('../utils/alertRules');
const { logger } = require('../config/logger');

async function runContractBalanceJob() {
  const contracts = await alertRepository.listContractsForBalanceAlerts();
  let created = 0;

  for (const contract of contracts) {
    const level = classifyBalanceAlert(contract.balance_percentage);

    if (!level) {
      continue;
    }

    const result = await notificationService.createContractNotification({
      contractId: contract.id,
      eventKey: buildBalanceEventKey(contract.id, level),
      eventType: 'CONTRACT_BALANCE',
      severity: level,
      title: `Contrato ${contract.contract_key} atingiu ${contract.balance_percentage}% de saldo`,
      message: `O contrato ${contract.contract_key} de ${contract.supplier_name} esta com ${contract.balance_percentage}% de saldo disponivel.`,
      metadata: {
        balancePercentage: contract.balance_percentage,
        level
      }
    });

    if (result.created) {
      created += 1;
    }
  }

  logger.info('Job de saldo executado.', { checked: contracts.length, created });
  return { checked: contracts.length, created };
}

module.exports = { runContractBalanceJob };
