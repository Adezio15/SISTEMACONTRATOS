const reportService = require('../services/reportService');
const { formatCurrency, formatDate, formatPercent } = require('../utils/formatters');

async function index(req, res, next) {
  try {
    const [rows, options] = await Promise.all([
      reportService.getContractsReport(req.query),
      reportService.getReportOptions()
    ]);

    res.render('reports/index', {
      title: 'Relatorios',
      rows,
      options,
      filters: req.query,
      formatCurrency,
      formatDate,
      formatPercent
    });
  } catch (error) {
    next(error);
  }
}

async function exportContracts(req, res, next) {
  try {
    const rows = await reportService.getContractsReport(req.query);
    const buffer = reportService.buildContractsWorkbook(rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_contratos.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  exportContracts
};
