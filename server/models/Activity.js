const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: {
        values: [
          'note',
          'call',
          'email',
          'meeting',
          'status_change',
          'task_completed',
          'score_update',
          'stage_transition'
        ],
        message: '{VALUE} is not a valid activity type'
      },
      required: true
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ lead: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
