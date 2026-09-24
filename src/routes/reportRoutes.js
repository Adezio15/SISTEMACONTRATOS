const express = require('express');

const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/relatorios', requireAuth, requirePermission('reports.view'), reportController.index);
router.get('/relatorios/contratos.xlsx', requireAuth, requirePermission('reports.view'), reportController.exportContracts);

module.exports = router;
