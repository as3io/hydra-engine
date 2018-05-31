const { Schema } = require('mongoose');

const role = {
  type: String,
  required: true,
  default: 'Member',
  enum: [
    'Owner',
    'Administrator',
    'Member',
  ],
};

const projectRole = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'project',
  },
  role,
});

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'organization',
  },
  role,
  invited: {
    type: Date,
    default: () => new Date(),
  },
  accepted: Date,
  projects: [projectRole],
}, { timestamps: true });

schema.index({ organizationId: 1, userId: 1 }, { unique: true });
schema.index({ organizationId: 1, userId: 1, 'projects.projectId': 1 });

module.exports = schema;
