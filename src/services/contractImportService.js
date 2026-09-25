const path = require('path');

const { getPool, hasDatabaseConfig } = require('../config/database');
const importRepository = require('../repositories/importRepository');
const { readContractsFromSpreadsheet } = require('../dataSources/excelContractSource');
const { readContractsFromCsv } = require('../dataSources/csvContractSource');
const { buildHeaderMap } = require('./importMappingService');
const { normalizeContractImportRow } = require('./contractImportNormalizer');

const EXTERNAL_FIELDS = [
  'supplier_name',
  'document_number',
  'object',
  'unit',
  'initial_value',
  'updated_value',
  'current_balance',
  'start_date',
  'end_date',
  'status',
  'external_status'
];

function readRows(filePath, originalName) {
  const extension = path.extname(originalName).toLowerCase();

  if (extension === '.csv') {
    return readContractsFromCsv(filePath);
  }

  return readContractsFromSpreadsheet(filePath);
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
}

function valuesAreEqual(a, b) {
  const numberA = Number(a);
  const numberB = Number(b);

  if (a !== null && a !== undefined && b !== null && b !== undefined && Number.isFinite(numberA) && Number.isFinite(numberB)) {
    return numberA === numberB;
  }

  return normalizeValue(a) === normalizeValue(b);
}

function compareContract(existing, normalized) {
  if (!existing) {
    return [];
  }

  return EXTERNAL_FIELDS
    .filter((field) => !valuesAreEqual(existing[field], normalized[field]))
    .map((field) => ({
      field,
      oldValue: existing[field],
      newValue: normalized[field]
    }));
}

function summarizeRows(rows) {
  return rows.reduce((summary, row) => {
    summary.totalRows += 1;

    if (row.action === 'NEW') summary.newRecords += 1;
    if (row.action === 'UPDATE') summary.updatedRecords += 1;
    if (row.action === 'UNCHANGED') summary.unchangedRecords += 1;
    if (row.action === 'ERROR') summary.errorRecords += 1;

    return summary;
  }, {
    totalRows: 0,
    newRecords: 0,
    updatedRecords: 0,
    unchangedRecords: 0,
    errorRecords: 0
  });
}

function getProcessableRows(rows) {
  return rows.filter((row) => ['NEW', 'UPDATE'].includes(row.action));
}

async function createPreview({ file, userId }) {
  if (!hasDatabaseConfig()) {
    throw new Error('Modo local demo: configure DATABASE_URL para validar e importar arquivos.');
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('begin');

    const importRecord = await importRepository.createImport({
      filename: file.originalname,
      storedFilename: file.filename,
      userId,
      status: 'VALIDATING'
    }, client);

    const rawRows = readRows(file.path, file.originalname);
    const headerMap = rawRows[0] ? buildHeaderMap(rawRows[0]) : {};
    const normalizedRows = rawRows.map((row, index) => {
      const result = normalizeContractImportRow(row, headerMap);

      return {
        rowNumber: index + 2,
        rawData: row,
        normalizedData: result.normalized,
        contractKey: result.normalized.contract_key,
        errors: result.errors,
        differences: [],
        action: result.errors.length ? 'ERROR' : 'UNCHANGED'
      };
    });

    const validKeys = normalizedRows
      .filter((row) => row.contractKey && row.errors.length === 0)
      .map((row) => row.contractKey);
    const existingContracts = await importRepository.findContractsByKeys(validKeys, client);
    const possibleAbsentRecords = await importRepository.countContractsNotInKeys(validKeys, client);
    const existingByKey = new Map(existingContracts.map((contract) => [contract.contract_key, contract]));
    const seenKeys = new Set();

    normalizedRows.forEach((row) => {
      if (row.errors.length > 0) {
        return;
      }

      if (seenKeys.has(row.contractKey)) {
        row.action = 'ERROR';
        row.errors.push('Contrato duplicado dentro do arquivo.');
        return;
      }

      seenKeys.add(row.contractKey);

      const existing = existingByKey.get(row.contractKey);

      if (!existing) {
        row.action = 'NEW';
        return;
      }

      row.differences = compareContract(existing, row.normalizedData);
      row.action = row.differences.length > 0 ? 'UPDATE' : 'UNCHANGED';
    });

    const summary = summarizeRows(normalizedRows);
    await importRepository.createImportRows(importRecord.id, normalizedRows, client);
    const updatedImport = await importRepository.updateImportSummary(importRecord.id, {
      ...summary,
      possibleAbsentRecords,
      status: summary.errorRecords > 0 ? 'READY' : 'READY'
    }, client);

    await client.query('commit');

    return {
      importRecord: updatedImport,
      rows: normalizedRows
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function listImports() {
  if (!hasDatabaseConfig()) {
    return [];
  }

  return importRepository.listImports();
}

async function getPreview(importId) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  const importRecord = await importRepository.getImportById(importId);

  if (!importRecord) {
    return null;
  }

  const rows = await importRepository.listImportRows(importId);

  return {
    importRecord,
    rows
  };
}

function historyForNewContract({ contract, userId, importId }) {
  return EXTERNAL_FIELDS
    .filter((field) => contract[field] !== null && contract[field] !== undefined && contract[field] !== '')
    .map((field) => ({
      contractId: contract.id,
      userId,
      importId,
      fieldName: field,
      oldValue: null,
      newValue: normalizeValue(contract[field])
    }));
}

function historyForDifferences({ contractId, differences, userId, importId }) {
  return differences.map((difference) => ({
    contractId,
    userId,
    importId,
    fieldName: difference.field,
    oldValue: normalizeValue(difference.oldValue),
    newValue: normalizeValue(difference.newValue)
  }));
}

async function confirmImport({ importId, userId }) {
  if (!hasDatabaseConfig()) {
    throw new Error('Modo local demo: configure DATABASE_URL para confirmar importacoes.');
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('begin');

    const importRecord = await importRepository.getImportById(importId, client);

    if (!importRecord) {
      throw new Error('Importacao nao encontrada.');
    }

    if (importRecord.status !== 'READY') {
      throw new Error('Importacao nao esta pronta para confirmacao.');
    }

    await importRepository.setImportStatus(importId, 'PROCESSING', client);

    const rows = await importRepository.listImportRows(importId, client);
    const processableRows = getProcessableRows(rows);

    if (processableRows.length === 0) {
      throw new Error('Nao ha linhas validas para confirmar nesta importacao.');
    }

    const existingContracts = await importRepository.findContractsByKeys(
      processableRows.map((row) => row.contract_key),
      client
    );
    const existingByKey = new Map(existingContracts.map((contract) => [contract.contract_key, contract]));
    const historyEntries = [];

    for (const row of processableRows) {
      const normalized = row.normalized_data;
      const differences = row.differences || [];
      const companyId = await importRepository.upsertCompany(normalized, client);
      const existing = existingByKey.get(row.contract_key);

      if (row.action === 'NEW' || !existing) {
        const contract = await importRepository.insertContract(normalized, companyId, client);
        await importRepository.insertResponsibles(contract.id, normalized.responsibles, client);
        historyEntries.push(...historyForNewContract({ contract, userId, importId }));
        continue;
      }

      const contract = await importRepository.updateContract(existing.id, normalized, companyId, client);
      await importRepository.insertResponsibles(contract.id, normalized.responsibles, client);
      historyEntries.push(
        ...historyForDifferences({
          contractId: contract.id,
          differences,
          userId,
          importId
        })
      );
    }

    await importRepository.insertHistoryEntries(historyEntries, client);
    await importRepository.setImportStatus(importId, 'COMPLETED', client);
    await client.query('commit');

    return true;
  } catch (error) {
    await client.query('rollback');
    const failClient = await pool.connect();
    try {
      await importRepository.setImportStatus(importId, 'FAILED', failClient);
    } finally {
      failClient.release();
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createPreview,
  listImports,
  getPreview,
  confirmImport,
  compareContract,
  summarizeRows,
  getProcessableRows
};
