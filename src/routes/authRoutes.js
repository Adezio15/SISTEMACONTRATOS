const express = require('express');

const authController = require('../controllers/authController');
const { redirectIfAuthenticated, requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/senha/esqueci', redirectIfAuthenticated, authController.showForgotPassword);
router.post('/senha/esqueci', redirectIfAuthenticated, authController.requestPasswordReset);
router.get('/senha/alterar', requireAuth, authController.showChangePassword);
router.post('/senha/alterar', requireAuth, authController.changePassword);

module.exports = router;
