const { readContractsFromSpreadsheet } = require('./excelContractSource');

function readContractsFromCsv(filePath) {
  return readContractsFromSpreadsheet(filePath);
}

module.exports = { readContractsFromCsv };
