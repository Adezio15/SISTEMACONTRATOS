const express = require('express');

const importController = require('../controllers/importController');
const { importUpload } = require('../config/upload');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/importacoes', requireAuth, requirePermission('imports.manage'), importController.index);
router.post('/importacoes', requireAuth, requirePermission('imports.manage'), importUpload.single('file'), importController.store);
router.get('/importacoes/:id', requireAuth, requirePermission('imports.manage'), importController.show);
router.post('/importacoes/:id/confirmar', requireAuth, requirePermission('imports.manage'), importController.confirm);

module.exports = router;
