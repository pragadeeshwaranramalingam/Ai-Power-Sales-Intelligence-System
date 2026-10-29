const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { validateTask } = require('../validators/taskValidator');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(validateTask, createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/toggle', toggleTaskStatus);

module.exports = router;
