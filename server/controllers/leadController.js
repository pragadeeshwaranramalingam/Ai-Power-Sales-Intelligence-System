const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const {
  calculateLeadIntelligence,
  generatePipelineInsights,
  computeUrgencyRank
} = require('../services/aiEngine');
const { parseAndValidateCSV, exportLeadsToCSV } = require('../services/csvService');

// Helper to determine query scoping based on user role
const getLeadScope = (user) => {
  if (user.role === 'admin') {
    return {};
  }
  return {
    $or: [{ owner: user._id }, { assignedTo: user._id }]
  };
};

// @desc    Get all leads with search, filtering, sorting, and pagination
// @route   GET /api/v1/leads
// @access  Private
const getLeads = async (req, res, next) => {
  try {
    const scope = getLeadScope(req.user);
    const query = { ...scope };

    // Search filter (name, email, company)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { company: searchRegex },
          { jobTitle: searchRegex }
        ]
      });
    }

    // Exact match filters
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.industry && req.query.industry !== 'all') {
      query.industry = req.query.industry;
    }
    if (req.query.source && req.query.source !== 'all') {
      query.source = req.query.source;
    }
    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }
    if (req.query.aiCategory && req.query.aiCategory !== 'all') {
      query.aiCategory = req.query.aiCategory;
    }
    if (req.query.assignedTo && req.query.assignedTo !== 'all') {
      query.assignedTo = req.query.assignedTo;
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email avatar department')
      .populate('owner', 'name email');

    res.status(200).json({
      success: true,
      count: leads.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit
      },
      leads
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single lead by ID
// @route   GET /api/v1/leads/:id
// @access  Private
const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email avatar department')
      .populate('owner', 'name email');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Authorization check
    if (
      req.user.role !== 'admin' &&
      lead.owner._id.toString() !== req.user._id.toString() &&
      lead.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this lead'
      });
    }

    res.status(200).json({
      success: true,
      lead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new lead
// @route   POST /api/v1/leads
// @access  Private
const createLead = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();

    // Check duplicate email within this user's organization
    const existing = await Lead.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A lead with email '${email}' already exists in the system`
      });
    }

    const leadData = {
      ...req.body,
      email,
      owner: req.user._id,
      assignedTo: req.body.assignedTo || req.user._id
    };

    // Calculate AI Intelligence metrics
    const aiIntelligence = calculateLeadIntelligence(leadData, []);
    Object.assign(leadData, aiIntelligence);

    const lead = await Lead.create(leadData);

    // Record creation activity
    await Activity.create({
      lead: lead._id,
      user: req.user._id,
      type: 'note',
      title: 'Lead Created',
      description: `Lead created from source: ${lead.source} with initial deal value $${lead.dealValue.toLocaleString()}`
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email avatar department')
      .populate('owner', 'name email');

    res.status(201).json({
      success: true,
      lead: populatedLead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an existing lead
// @route   PUT /api/v1/leads/:id
// @access  Private
const updateLead = async (req, res, next) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Role verification
    if (
      req.user.role !== 'admin' &&
      lead.owner.toString() !== req.user._id.toString() &&
      lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot edit this lead'
      });
    }

    // Duplicate email check if email is modified
    if (req.body.email && req.body.email.toLowerCase() !== lead.email) {
      const email = req.body.email.toLowerCase();
      const existing = await Lead.findOne({ email, _id: { $ne: lead._id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Email '${email}' is already used by another lead`
        });
      }
    }

    const previousStatus = lead.status;
    const newStatus = req.body.status;

    // Merge updates into temporary object to run AI intelligence
    const updatedPayload = { ...lead.toObject(), ...req.body };
    const recentActivities = await Activity.find({ lead: lead._id }).sort({ createdAt: -1 }).limit(5);

    // Recalculate AI score with updated attributes
    const aiIntelligence = calculateLeadIntelligence(updatedPayload, recentActivities);
    Object.assign(req.body, aiIntelligence);

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('assignedTo', 'name email avatar department')
      .populate('owner', 'name email');

    // Automatic activity logging on status change
    if (newStatus && newStatus !== previousStatus) {
      await Activity.create({
        lead: lead._id,
        user: req.user._id,
        type: 'stage_transition',
        title: `Pipeline Stage Updated: ${previousStatus} → ${newStatus}`,
        description: `Lead transitioned from stage '${previousStatus}' to '${newStatus}' by ${req.user.name}.`
      });
    }

    res.status(200).json({
      success: true,
      lead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a lead
// @route   DELETE /api/v1/leads/:id
// @access  Private
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Role check
    if (
      req.user.role !== 'admin' &&
      lead.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only admins or the lead owner can delete this record'
      });
    }

    // Clean up dependent activities and tasks
    await Activity.deleteMany({ lead: lead._id });
    await Task.deleteMany({ lead: lead._id });
    await Lead.findByIdAndDelete(lead._id);

    res.status(200).json({
      success: true,
      message: 'Lead and associated activities removed successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add activity / interaction to lead
// @route   POST /api/v1/leads/:id/activities
// @access  Private
const addActivity = async (req, res, next) => {
  try {
    const { type, title, description, metadata } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const activity = await Activity.create({
      lead: lead._id,
      user: req.user._id,
      type: type || 'note',
      title,
      description,
      metadata: metadata || {}
    });

    // Update lead contact timestamps
    lead.lastContactedAt = new Date();
    if (metadata?.nextFollowUpAt) {
      lead.nextFollowUpAt = new Date(metadata.nextFollowUpAt);
    }

    // Refresh AI score with new activity
    const recentActivities = await Activity.find({ lead: lead._id }).sort({ createdAt: -1 }).limit(5);
    const aiIntelligence = calculateLeadIntelligence(lead, recentActivities);
    Object.assign(lead, aiIntelligence);
    await lead.save();

    const populatedActivity = await Activity.findById(activity._id).populate('user', 'name email avatar');

    res.status(201).json({
      success: true,
      activity: populatedActivity,
      lead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all activities for a lead
// @route   GET /api/v1/leads/:id/activities
// @access  Private
const getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ lead: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AI Insights for lead
// @route   GET /api/v1/leads/:id/insights
// @access  Private
const getLeadInsights = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const recentActivities = await Activity.find({ lead: lead._id }).sort({ createdAt: -1 }).limit(5);
    const intelligence = calculateLeadIntelligence(lead, recentActivities);
    const urgencyRank = computeUrgencyRank(lead);

    res.status(200).json({
      success: true,
      intelligence: {
        ...intelligence,
        urgencyRank
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import leads via CSV text or multipart file
// @route   POST /api/v1/leads/import
// @access  Private
const importLeads = async (req, res, next) => {
  try {
    let csvData = '';

    if (req.file) {
      csvData = req.file.buffer.toString('utf-8');
    } else if (req.body.csvText) {
      csvData = req.body.csvText;
    } else {
      return res.status(400).json({
        success: false,
        message: 'No CSV content provided. Provide a CSV file upload or csvText string'
      });
    }

    const { validLeads, errors, totalProcessed } = await parseAndValidateCSV(
      csvData,
      req.user._id,
      Lead
    );

    let insertedCount = 0;
    if (validLeads.length > 0) {
      const inserted = await Lead.insertMany(validLeads);
      insertedCount = inserted.length;

      // Add bulk activity log
      await Promise.all(
        inserted.map(l =>
          Activity.create({
            lead: l._id,
            user: req.user._id,
            type: 'note',
            title: 'Lead Imported',
            description: `Imported via bulk CSV upload.`
          })
        )
      );
    }

    res.status(200).json({
      success: true,
      totalProcessed,
      importedCount,
      failedCount: errors.length,
      errors
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export leads to downloadable CSV
// @route   GET /api/v1/leads/export
// @access  Private
const exportLeads = async (req, res, next) => {
  try {
    const scope = getLeadScope(req.user);
    const leads = await Lead.find(scope)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email');

    const csvContent = exportLeadsToCSV(leads);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales_leads_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addActivity,
  getActivities,
  getLeadInsights,
  importLeads,
  exportLeads
};
