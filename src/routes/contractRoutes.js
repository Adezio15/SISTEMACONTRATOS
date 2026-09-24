const express = require('express');

const contractController = require('../controllers/contractController');
const { documentUpload } = require('../config/documentUpload');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/contratos', requireAuth, requirePermission('contracts.view'), contractController.index);
router.get('/contratos/:id', requireAuth, requirePermission('contracts.view'), contractController.show);
router.get('/contratos/:id/documentos/:documentId/download', requireAuth, requirePermission('contracts.view'), contractController.downloadDocument);
router.post('/contratos/:id/documentos', requireAuth, requirePermission('contracts.manage'), documentUpload.single('file'), contractController.addDocument);
router.post('/contratos/:id/pendencias', requireAuth, requirePermission('contracts.manage'), contractController.addTask);
router.post('/contratos/:id/observacoes', requireAuth, requirePermission('contracts.manage'), contractController.addNote);

module.exports = router;
