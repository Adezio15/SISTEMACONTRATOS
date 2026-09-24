const express = require('express');

const taskController = require('../controllers/taskController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/pendencias', requireAuth, taskController.index);
router.post('/pendencias/:id/status', requireAuth, taskController.updateStatus);

module.exports = router;
