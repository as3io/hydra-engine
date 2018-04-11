const mongoose = require('mongoose');

const { Schema } = mongoose;

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
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project',
  },
  role,
});

const orgMember = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  role,
  invited: {
    type: Date,
    default: () => new Date(),
  },
  projects: [projectRole],
});

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  members: [orgMember],
}, { timestamps: true });

module.exports = schema;
