const contractRepository = require('../repositories/contractRepository');
const { hasDatabaseConfig } = require('../config/database');
const {
  demoHistory,
  demoNotes,
  getDemoContractById,
  getDemoContracts,
  getDemoTasks
} = require('../data/localDemoData');
const documentRepository = require('../repositories/documentRepository');
const historyRepository = require('../repositories/historyRepository');
const noteRepository = require('../repositories/noteRepository');
const taskRepository = require('../repositories/taskRepository');
const {
  calculateBalancePercentage,
  classifyBalance,
  calculateContractStatus
} = require('../utils/contractRules');

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function normalizeListQuery(query) {
  const page = parsePositiveInteger(query.page, 1);
  const limit = Math.min(parsePositiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT);

  return {
    filters: {
      search: query.search?.trim(),
      contractNumber: query.contractNumber?.trim(),
      year: parseOptionalInteger(query.year),
      supplier: query.supplier?.trim(),
      documentNumber: query.documentNumber?.trim(),
      object: query.object?.trim(),
      unit: query.unit?.trim(),
      status: query.status,
      endFrom: query.endFrom,
      endTo: query.endTo,
      balanceMin: parseOptionalNumber(query.balanceMin),
      balanceMax: parseOptionalNumber(query.balanceMax),
      balancePercentageMax: parseOptionalNumber(query.balancePercentageMax),
      analyst: query.analyst?.trim(),
      fiscal: query.fiscal?.trim(),
      manager: query.manager?.trim(),
      responsible: query.responsible?.trim()
    },
    pagination: {
      page,
      limit,
      offset: (page - 1) * limit
    },
    sort: {
      field: query.sort || 'end_date',
      direction: query.direction === 'desc' ? 'desc' : 'asc'
    }
  };
}

function enrichContract(contract) {
  return {
    ...contract,
    calculated_status: calculateContractStatus(contract),
    balance_percentage: contract.balance_percentage === null
      ? calculateBalancePercentage(contract)
      : Number(contract.balance_percentage),
    balance_classification: classifyBalance(contract)
  };
}

async function listContracts(query) {
  const options = normalizeListQuery(query);

  if (!hasDatabaseConfig()) {
    const contracts = getDemoContracts().map(enrichContract);

    return {
      contracts,
      filters: options.filters,
      sort: options.sort,
      pagination: {
        ...options.pagination,
        total: contracts.length,
        totalPages: 1
      },
      filterOptions: {
        years: [...new Set(contracts.map((contract) => contract.contract_year))],
        units: [...new Set(contracts.map((contract) => contract.unit).filter(Boolean))]
      }
    };
  }

  const result = await contractRepository.listContracts(options);
  const totalPages = Math.max(Math.ceil(result.total / options.pagination.limit), 1);

  return {
    contracts: result.rows.map(enrichContract),
    filters: options.filters,
    sort: options.sort,
    pagination: {
      ...options.pagination,
      total: result.total,
      totalPages
    },
    filterOptions: await contractRepository.getFilterOptions()
  };
}

async function getContractDetails(id) {
  if (!hasDatabaseConfig()) {
    const contract = getDemoContractById(id);

    if (!contract) {
      return null;
    }

    return {
      contract: enrichContract(contract),
      responsibles: contract.responsibles.map((responsible) => ({
        ...responsible,
        display_name: responsible.name,
        display_email: responsible.email,
        display_registration: responsible.registration
      })),
      documents: [],
      tasks: getDemoTasks({ contractId: id }),
      notes: id === 'demo-contract-1' ? demoNotes : [],
      history: demoHistory
    };
  }

  const contract = await contractRepository.findContractById(id);

  if (!contract) {
    return null;
  }

  const [responsibles, documents, tasks, notes, history] = await Promise.all([
    contractRepository.listResponsibles(id),
    documentRepository.listDocuments(id),
    taskRepository.listTasks({ contractId: id }),
    noteRepository.listNotes(id),
    historyRepository.listHistory(id)
  ]);

  return {
    contract: enrichContract(contract),
    responsibles,
    documents,
    tasks,
    notes,
    history
  };
}

module.exports = {
  listContracts,
  getContractDetails,
  normalizeListQuery
};
