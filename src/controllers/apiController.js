const contractImportService = require('../services/contractImportService');
const contractService = require('../services/contractService');
const dashboardService = require('../services/dashboardService');

async function listContracts(req, res, next) {
  try {
    const data = await contractService.listContracts(req.query);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getContract(req, res, next) {
  try {
    const data = await contractService.getContractDetails(req.params.id);

    if (!data) {
      return res.status(404).json({ ok: false, error: 'contract_not_found' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function analystDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getAnalystDashboard(req.session.user);
    return res.json(dashboard);
  } catch (error) {
    return next(error);
  }
}

async function managementDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getManagementDashboard();
    return res.json(dashboard);
  } catch (error) {
    return next(error);
  }
}

async function listImports(req, res, next) {
  try {
    const imports = await contractImportService.listImports();
    return res.json({ imports });
  } catch (error) {
    return next(error);
  }
}

async function createImport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: 'file_required'
      });
    }

    const result = await contractImportService.createPreview({
      file: req.file,
      userId: req.session.user.id
    });

    return res.status(201).json({
      ok: true,
      importRecord: result.importRecord,
      rows: result.rows
    });
  } catch (error) {
    return next(error);
  }
}

async function getImport(req, res, next) {
  try {
    const data = await contractImportService.getPreview(req.params.id);

    if (!data) {
      return res.status(404).json({ ok: false, error: 'import_not_found' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function confirmImport(req, res, next) {
  try {
    await contractImportService.confirmImport({
      importId: req.params.id,
      userId: req.session.user.id
    });

    return res.json({ ok: true });
  } catch (error) {
    return res.status(422).json({
      ok: false,
      error: error.message || 'import_confirm_failed'
    });
  }
}

module.exports = {
  listContracts,
  getContract,
  analystDashboard,
  managementDashboard,
  listImports,
  createImport,
  getImport,
  confirmImport
};
