const validateTask = (req, res, next) => {
  const { title, dueDate } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Task title is required');
  }

  if (!dueDate || isNaN(new Date(dueDate).getTime())) {
    errors.push('A valid due date is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors[0] });
  }

  next();
};

module.exports = { validateTask };
