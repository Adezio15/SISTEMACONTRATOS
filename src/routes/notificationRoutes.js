const express = require('express');

const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/notificacoes', requireAuth, notificationController.index);
router.post('/notificacoes/:id/lida', requireAuth, notificationController.markAsRead);
router.post('/notificacoes/marcar-todas', requireAuth, notificationController.markAllAsRead);
router.get('/api/notifications', requireAuth, notificationController.apiList);

module.exports = router;
