const express = require('express');

const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/usuarios', requireAuth, requirePermission('users.manage'), userController.index);
router.get('/usuarios/novo', requireAuth, requirePermission('users.manage'), userController.create);
router.post('/usuarios', requireAuth, requirePermission('users.manage'), userController.store);
router.get('/usuarios/:id/editar', requireAuth, requirePermission('users.manage'), userController.edit);
router.post('/usuarios/:id', requireAuth, requirePermission('users.manage'), userController.update);
router.post('/usuarios/:id/senha', requireAuth, requirePermission('users.manage'), userController.resetPassword);

module.exports = router;
