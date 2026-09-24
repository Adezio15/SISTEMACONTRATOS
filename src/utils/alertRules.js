const EXPIRATION_WARNING_DAYS = [90, 60, 30, 15, 7];

function buildExpirationEventKey(contractId, days) {
  return `contract:${contractId}:expiration:${days}`;
}

function buildBalanceEventKey(contractId, level) {
  return `contract:${contractId}:balance:${level}`;
}

function classifyBalanceAlert(balancePercentage) {
  if (balancePercentage === null || balancePercentage === undefined) {
    return null;
  }

  const value = Number(balancePercentage);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (value <= 10) {
    return 'CRITICAL';
  }

  if (value <= 30) {
    return 'WARNING';
  }

  return null;
}

function expirationWarningForDays(daysUntilExpiration, warningDays = EXPIRATION_WARNING_DAYS) {
  const days = Number(daysUntilExpiration);

  if (!Number.isInteger(days) || days < 0) {
    return null;
  }

  return warningDays.includes(days) ? days : null;
}

module.exports = {
  EXPIRATION_WARNING_DAYS,
  buildExpirationEventKey,
  buildBalanceEventKey,
  classifyBalanceAlert,
  expirationWarningForDays
};
