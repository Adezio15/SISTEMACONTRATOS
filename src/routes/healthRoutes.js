const express = require('express');

const healthController = require('../controllers/healthController');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/healthz', healthController.healthz);
router.get('/readyz', healthController.readyz);
router.get('/admin/saude-da-base', requireAuth, requirePermission('settings.manage'), healthController.baseHealth);

module.exports = router;
