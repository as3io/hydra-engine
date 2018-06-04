const { Schema } = require('mongoose');
const connection = require('../connections/mongoose');

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
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('project').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No project found for ID {VALUE}',
    },
  },
  role,
});

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('user').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No user found for ID {VALUE}',
    },
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'organization',
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('organization').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No organization found for ID {VALUE}',
    },
  },
  role,
  invitedAt: {
    type: Date,
    default: () => new Date(),
  },
  acceptedAt: Date,
  projectRoles: [projectRole],
}, { timestamps: true });

schema.index({ organizationId: 1, userId: 1 }, { unique: true });
schema.index({ organizationId: 1, userId: 1, 'projects.projectId': 1 });

module.exports = schema;
