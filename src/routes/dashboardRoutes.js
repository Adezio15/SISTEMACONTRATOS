const express = require('express');

const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/dashboard', requireAuth, dashboardController.index);
router.get('/dashboard/gerencia', requireAuth, requirePermission('dashboards.view'), dashboardController.management);
router.get('/dashboard/tv', requireAuth, requirePermission('tv.view'), dashboardController.tv);
router.get('/api/dashboard/tv', requireAuth, requirePermission('tv.view'), dashboardController.tvData);

module.exports = router;
