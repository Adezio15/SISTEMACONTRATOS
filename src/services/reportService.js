const XLSX = require('xlsx');
const { hasDatabaseConfig } = require('../config/database');
const { getDemoContracts } = require('../data/localDemoData');
const reportRepository = require('../repositories/reportRepository');

async function getContractsReport(filters) {
  if (!hasDatabaseConfig()) {
    return getDemoContracts();
  }

  return reportRepository.getContractsReport(filters);
}

async function getReportOptions() {
  if (!hasDatabaseConfig()) {
    return {
      units: [...new Set(getDemoContracts().map((contract) => contract.unit).filter(Boolean))]
    };
  }

  return reportRepository.getReportOptions();
}

function buildContractsWorkbook(rows) {
  const data = rows.map((row) => ({
    Contrato: row.contract_key,
    Exercicio: row.contract_year,
    Fornecedor: row.supplier_name,
    Documento: row.document_number,
    Objeto: row.object,
    Unidade: row.unit,
    Status: row.status,
    Valor: Number(row.effective_value || 0),
    Saldo: Number(row.current_balance || 0),
    PercentualSaldo: row.balance_percentage,
    Inicio: row.start_date,
    Vencimento: row.end_date
  }));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contratos');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  getContractsReport,
  getReportOptions,
  buildContractsWorkbook
};
