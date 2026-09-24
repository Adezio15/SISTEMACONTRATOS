const dashboardService = require('../services/dashboardService');
const { formatCurrency, formatDate, formatPercent } = require('../utils/formatters');
const { getChartMaxValue, getBarWidth } = require('../utils/chartRules');

async function index(req, res, next) {
  if (req.session.user.roleKey === 'TV_GERENCIA') {
    return res.redirect('/dashboard/tv');
  }

  if (['ADMINISTRADOR', 'GERENCIA'].includes(req.session.user.roleKey)) {
    return res.redirect('/dashboard/gerencia');
  }

  try {
    const dashboard = await dashboardService.getAnalystDashboard(req.session.user);

    return res.render('dashboard/index', {
      title: 'Dashboard',
      dashboard,
      formatCurrency,
      formatDate,
      formatPercent,
      getChartMaxValue,
      getBarWidth
    });
  } catch (error) {
    return next(error);
  }
}

async function management(req, res, next) {
  try {
    const dashboard = await dashboardService.getManagementDashboard();

    return res.render('dashboard/management', {
      title: 'Dashboard Gerencial',
      dashboard,
      formatCurrency,
      formatDate,
      formatPercent,
      getChartMaxValue,
      getBarWidth
    });
  } catch (error) {
    return next(error);
  }
}

async function tv(req, res, next) {
  try {
    const dashboard = await dashboardService.getTvDashboard();

    return res.render('dashboard/tv', {
      title: 'Dashboard TV',
      dashboard
    });
  } catch (error) {
    return next(error);
  }
}

async function tvData(req, res, next) {
  try {
    const dashboard = await dashboardService.getTvDashboard();
    return res.json(dashboard);
  } catch (error) {
    return next(error);
  }
}

module.exports = { index, management, tv, tvData };
