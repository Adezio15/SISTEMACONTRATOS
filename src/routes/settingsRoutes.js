const express = require('express');

const settingsController = require('../controllers/settingsController');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/configuracoes', requireAuth, requirePermission('settings.manage'), settingsController.index);
router.post('/configuracoes', requireAuth, requirePermission('settings.manage'), settingsController.update);

module.exports = router;
