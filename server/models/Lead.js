const mongoose = require('mongoose');

const factorSchema = new mongoose.Schema(
  {
    factor: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    impact: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    description: { type: String, required: true }
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead contact name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid lead email address'
      ]
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters']
    },
    jobTitle: {
      type: String,
      trim: true,
      default: 'Decision Maker'
    },
    industry: {
      type: String,
      enum: {
        values: [
          'Technology',
          'Healthcare',
          'Finance',
          'Manufacturing',
          'Retail',
          'Education',
          'Real Estate',
          'Logistics',
          'Professional Services',
          'Other'
        ],
        message: '{VALUE} is not a supported industry'
      },
      default: 'Technology'
    },
    source: {
      type: String,
      enum: {
        values: [
          'Website',
          'Referral',
          'LinkedIn',
          'Cold Outreach',
          'Event',
          'Partner',
          'Inbound Form',
          'Organic Search',
          'Other'
        ],
        message: '{VALUE} is not a valid lead source'
      },
      default: 'Website'
    },
    dealValue: {
      type: Number,
      default: 5000,
      min: [0, 'Deal value cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
        message: '{VALUE} is not a valid pipeline status'
      },
      default: 'New'
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'Medium'
    },
    notes: {
      type: String,
      default: ''
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // AI Sales Intelligence Engine Computed Fields
    aiScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    aiCategory: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
      default: 'Warm'
    },
    aiFactors: [factorSchema],
    conversionLikelihood: {
      type: Number,
      default: 45,
      min: 0,
      max: 100
    },
    conversionSignals: {
      positives: [{ type: String }],
      negatives: [{ type: String }]
    },
    nextBestAction: {
      action: { type: String, default: 'Initiate Discovery Call' },
      reason: { type: String, default: 'Lead recently acquired; qualify requirements' },
      priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'High' },
      suggestedDate: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
    },
    lastContactedAt: {
      type: Date,
      default: null
    },
    nextFollowUpAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance and multi-tenancy
leadSchema.index({ owner: 1, email: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ aiScore: -1 });
leadSchema.index({ dealValue: -1 });
leadSchema.index({ industry: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: 'text', company: 'text', email: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
