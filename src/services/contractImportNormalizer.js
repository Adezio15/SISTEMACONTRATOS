const {
  buildContractKey,
  calculateContractStatus,
  identifyDocumentType,
  normalizeDocumentNumber
} = require('../utils/contractRules');

function cleanString(value) {
  const text = String(value || '').trim();
  return text || null;
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value)
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  const brDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (brDate) {
    const [, day, month, year] = brDate;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (isoDate) {
    const [, year, month, day] = isoDate;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function normalizeStatus(value) {
  const status = String(value || 'ATIVO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  if (['ATIVO', 'VENCIDO', 'CANCELADO', 'ENCERRADO', 'SUSPENSO'].includes(status)) {
    return status;
  }

  return 'ATIVO';
}

function pick(row, headerMap, field) {
  const key = headerMap[field];
  return key ? row[key] : undefined;
}

function normalizeContractImportRow(row, headerMap) {
  const documentNumber = normalizeDocumentNumber(pick(row, headerMap, 'document_number'));
  const contractNumber = cleanString(pick(row, headerMap, 'contract_number'));
  const contractYear = Number.parseInt(pick(row, headerMap, 'contract_year'), 10);
  const contractKey = buildContractKey(contractNumber, contractYear);
  const normalized = {
    contract_number: contractNumber,
    contract_year: Number.isInteger(contractYear) ? contractYear : null,
    contract_key: contractKey,
    supplier_name: cleanString(pick(row, headerMap, 'supplier_name')),
    document_number: documentNumber,
    document_type: identifyDocumentType(documentNumber),
    object: cleanString(pick(row, headerMap, 'object')),
    unit: cleanString(pick(row, headerMap, 'unit')),
    initial_value: parseMoney(pick(row, headerMap, 'initial_value')) || 0,
    updated_value: parseMoney(pick(row, headerMap, 'updated_value')),
    current_balance: parseMoney(pick(row, headerMap, 'current_balance')),
    start_date: parseDate(pick(row, headerMap, 'start_date')),
    end_date: parseDate(pick(row, headerMap, 'end_date')),
    status: normalizeStatus(pick(row, headerMap, 'status')),
    external_status: cleanString(pick(row, headerMap, 'external_status')),
    source: 'IMPORTACAO',
    responsibles: [
      ['ANALISTA', cleanString(pick(row, headerMap, 'analyst_name'))],
      ['FISCAL', cleanString(pick(row, headerMap, 'fiscal_name'))],
      ['GESTOR', cleanString(pick(row, headerMap, 'manager_name'))],
      ['CONTRATANTE', cleanString(pick(row, headerMap, 'contractor_name'))]
    ]
      .filter(([, name]) => Boolean(name))
      .map(([role, name]) => ({ role, name }))
  };
  const errors = [];

  normalized.status = calculateContractStatus(normalized);

  if (!normalized.contract_number) {
    errors.push('Numero do contrato nao informado.');
  }

  if (!normalized.contract_year) {
    errors.push('Exercicio/ano invalido ou nao informado.');
  }

  if (!normalized.contract_key) {
    errors.push('Chave logica do contrato nao pode ser calculada.');
  }

  if (!normalized.supplier_name) {
    errors.push('Fornecedor nao informado.');
  }

  if (!normalized.object) {
    errors.push('Objeto nao informado.');
  }

  return {
    normalized,
    errors
  };
}

module.exports = {
  normalizeContractImportRow,
  parseMoney,
  parseDate,
  normalizeStatus
};
