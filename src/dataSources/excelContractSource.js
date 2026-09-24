const XLSX = require('xlsx');

function readContractsFromSpreadsheet(filePath) {
  const workbook = XLSX.readFile(filePath, {
    cellDates: true,
    raw: false
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];

  return XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    blankrows: false
  });
}

module.exports = { readContractsFromSpreadsheet };
