const express = require('express');

const apiController = require('../controllers/apiController');
const { importUpload } = require('../config/upload');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/api/contracts', requireAuth, requirePermission('contracts.view'), apiController.listContracts);
router.get('/api/contracts/:id', requireAuth, requirePermission('contracts.view'), apiController.getContract);
router.get('/api/dashboard/analyst', requireAuth, apiController.analystDashboard);
router.get('/api/dashboard/management', requireAuth, requirePermission('dashboards.view'), apiController.managementDashboard);
router.get('/api/imports', requireAuth, requirePermission('imports.manage'), apiController.listImports);
router.post('/api/imports', requireAuth, requirePermission('imports.manage'), importUpload.single('file'), apiController.createImport);
router.get('/api/imports/:id', requireAuth, requirePermission('imports.manage'), apiController.getImport);
router.post('/api/imports/:id/confirm', requireAuth, requirePermission('imports.manage'), apiController.confirmImport);

module.exports = router;
