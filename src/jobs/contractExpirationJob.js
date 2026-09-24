const alertRepository = require('../repositories/alertRepository');
const notificationService = require('../services/notificationService');
const {
  buildExpirationEventKey,
  expirationWarningForDays
} = require('../utils/alertRules');
const { logger } = require('../config/logger');

async function runContractExpirationJob() {
  const contracts = await alertRepository.listContractsForExpirationAlerts();
  let created = 0;

  for (const contract of contracts) {
    const warningDays = expirationWarningForDays(contract.days_until_expiration);

    if (warningDays === null) {
      continue;
    }

    const result = await notificationService.createContractNotification({
      contractId: contract.id,
      eventKey: buildExpirationEventKey(contract.id, warningDays),
      eventType: 'CONTRACT_EXPIRATION',
      severity: warningDays <= 15 ? 'CRITICAL' : 'WARNING',
      title: `Contrato ${contract.contract_key} vence em ${warningDays} dias`,
      message: `O contrato ${contract.contract_key} de ${contract.supplier_name} vence em ${warningDays} dias.`,
      metadata: {
        warningDays,
        endDate: contract.end_date
      }
    });

    if (result.created) {
      created += 1;
    }
  }

  logger.info('Job de vencimento executado.', { checked: contracts.length, created });
  return { checked: contracts.length, created };
}

module.exports = { runContractExpirationJob };
