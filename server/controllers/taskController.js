const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');

// @desc    Get all tasks with filtering
// @route   GET /api/v1/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const query = {};

    // Reps see their assigned tasks, admins see all unless filtered
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    } else if (req.query.assignedTo && req.query.assignedTo !== 'all') {
      query.assignedTo = req.query.assignedTo;
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }

    if (req.query.leadId) {
      query.lead = req.query.leadId;
    }

    // Overdue filter
    if (req.query.overdue === 'true') {
      query.status = { $ne: 'completed' };
      query.dueDate = { $lt: new Date() };
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1 })
      .populate('lead', 'name company dealValue status')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new task
// @route   POST /api/v1/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, lead, assignedTo, dueDate, priority } = req.body;

    const task = await Task.create({
      title,
      description,
      lead: lead || null,
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
      dueDate,
      priority: priority || 'Medium'
    });

    // If task is linked to a lead, update nextFollowUpAt on the lead
    if (lead) {
      await Lead.findByIdAndUpdate(lead, {
        nextFollowUpAt: dueDate
      });

      // Record activity on the lead
      await Activity.create({
        lead,
        user: req.user._id,
        type: 'note',
        title: `Task Scheduled: ${title}`,
        description: `Due date: ${new Date(dueDate).toLocaleDateString()} | Priority: ${priority || 'Medium'}`
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate('lead', 'name company dealValue status')
      .populate('assignedTo', 'name email avatar');

    res.status(201).json({
      success: true,
      task: populatedTask
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task details
// @route   PUT /api/v1/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      task.assignedTo.toString() !== req.user._id.toString() &&
      task.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot edit this task' });
    }

    // If status changed to completed, set completedAt
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();

      // Log activity on the lead if linked
      if (task.lead) {
        await Activity.create({
          lead: task.lead,
          user: req.user._id,
          type: 'task_completed',
          title: `Task Completed: ${task.title}`,
          description: `Task marked completed by ${req.user.name}.`
        });
      }
    } else if (req.body.status && req.body.status !== 'completed') {
      req.body.completedAt = null;
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('lead', 'name company dealValue status')
      .populate('assignedTo', 'name email avatar');

    res.status(200).json({
      success: true,
      task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle task completion status
// @route   PATCH /api/v1/tasks/:id/toggle
// @access  Private
const toggleTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isNowCompleted = task.status !== 'completed';
    task.status = isNowCompleted ? 'completed' : 'pending';
    task.completedAt = isNowCompleted ? new Date() : null;
    await task.save();

    if (isNowCompleted && task.lead) {
      await Activity.create({
        lead: task.lead,
        user: req.user._id,
        type: 'task_completed',
        title: `Task Completed: ${task.title}`,
        description: `Task marked complete by ${req.user.name}.`
      });
    }

    const populated = await Task.findById(task._id)
      .populate('lead', 'name company dealValue status')
      .populate('assignedTo', 'name email avatar');

    res.status(200).json({
      success: true,
      task: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task removed successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask
};
