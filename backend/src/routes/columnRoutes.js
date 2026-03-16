const express = require('express');
const router = express.Router();
const columnController = require('../controllers/columnController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/board/:boardId', columnController.getColumns);
router.post('/board/:boardId', columnController.createColumn);
router.patch('/:id', columnController.updateColumn);
router.delete('/:id', columnController.deleteColumn);

module.exports = router;
