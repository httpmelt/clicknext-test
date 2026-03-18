const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/column/:columnId', taskController.getTasks);
router.post('/column/:columnId', taskController.createTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/assign', taskController.assignTask);
router.delete('/:id/assign', taskController.unassignTask);

module.exports = router;
