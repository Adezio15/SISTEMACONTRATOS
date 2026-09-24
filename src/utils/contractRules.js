function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeDocumentNumber(value) {
  const digits = onlyDigits(value);
  return digits || null;
}

function identifyDocumentType(value) {
  const digits = onlyDigits(value);

  if (digits.length === 14) {
    return 'CNPJ';
  }

  if (digits.length === 11) {
    return 'CPF';
  }

  return 'OUTRO';
}

function buildContractKey(contractNumber, contractYear) {
  const number = String(contractNumber || '').trim();
  const year = Number.parseInt(contractYear, 10);

  if (!number || !Number.isInteger(year)) {
    return null;
  }

  return `${number}/${year}`;
}

function getEffectiveContractValue(contract) {
  const updated = Number(contract.updated_value || contract.updatedValue || 0);
  const initial = Number(contract.initial_value || contract.initialValue || 0);

  return updated > 0 ? updated : initial;
}

function calculateBalancePercentage(contract) {
  const value = getEffectiveContractValue(contract);
  const balance = Number(contract.current_balance || contract.currentBalance || 0);

  if (!value) {
    return null;
  }

  return Number(((balance / value) * 100).toFixed(2));
}

function classifyBalance(contract) {
  const percentage = calculateBalancePercentage(contract);

  if (percentage === null) {
    return 'SEM_VALOR';
  }

  if (percentage <= 10) {
    return 'CRITICO';
  }

  if (percentage <= 30) {
    return 'ATENCAO';
  }

  return 'NORMAL';
}

function calculateContractStatus(contract, today = new Date()) {
  if (['CANCELADO', 'ENCERRADO', 'SUSPENSO'].includes(contract.status)) {
    return contract.status;
  }

  if (!contract.end_date && !contract.endDate) {
    return contract.status || 'ATIVO';
  }

  const endDate = new Date(contract.end_date || contract.endDate);
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return endOnly < todayOnly ? 'VENCIDO' : (contract.status || 'ATIVO');
}

module.exports = {
  normalizeDocumentNumber,
  identifyDocumentType,
  buildContractKey,
  calculateBalancePercentage,
  classifyBalance,
  calculateContractStatus
};
