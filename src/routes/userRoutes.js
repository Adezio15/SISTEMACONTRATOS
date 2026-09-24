const express = require('express');

const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.get('/usuarios', requireAuth, requirePermission('users.manage'), userController.index);
router.get('/usuarios/novo', requireAuth, requirePermission('users.manage'), userController.create);
router.post('/usuarios', requireAuth, requirePermission('users.manage'), userController.store);

module.exports = router;
