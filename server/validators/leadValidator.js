const validateLead = (req, res, next) => {
  const { name, email, company, dealValue } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Lead name must be at least 2 characters long');
  }

  if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
    errors.push('A valid lead email address is required');
  }

  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (dealValue !== undefined && (isNaN(Number(dealValue)) || Number(dealValue) < 0)) {
    errors.push('Deal value must be a non-negative number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors[0] });
  }

  next();
};

module.exports = { validateLead };
