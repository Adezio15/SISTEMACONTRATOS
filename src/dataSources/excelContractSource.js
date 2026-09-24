const XLSX = require('xlsx');
const { buildHeaderMap } = require('../services/importMappingService');

function rowToObject(headers, values) {
  return headers.reduce((row, header, index) => {
    const key = String(header || '').trim() || `__EMPTY_${index}`;
    row[key] = values[index] ?? '';
    return row;
  }, {});
}

function findHeaderRowIndex(rows) {
  let bestIndex = 0;
  let bestScore = 0;

  rows.slice(0, 25).forEach((row, index) => {
    const candidate = rowToObject(row, []);
    const score = Object.keys(buildHeaderMap(candidate)).length;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

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
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false
  });
  const headerRowIndex = findHeaderRowIndex(rows);
  const headers = rows[headerRowIndex] || [];

  return rows
    .slice(headerRowIndex + 1)
    .map((row) => rowToObject(headers, row))
    .filter((row) => Object.values(row).some((value) => String(value || '').trim()));
}

module.exports = { readContractsFromSpreadsheet };
