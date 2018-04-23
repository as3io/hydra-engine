const mongoose = require('mongoose');
const uuid = require('uuid/v4');

const { Schema } = mongoose;

const schema = new Schema({
  purpose: {
    type: String,
    enum: ['Public', 'Private'],
    default: 'Public',
  },
  scope: {
    type: String,
    enum: ['User', 'Organization', 'Project'],
    default: 'organization',
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'organization',
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project',
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },

  description: String,
  enabled: {
    type: Boolean,
    default: true,
  },
  value: {
    type: String,
    default: () => uuid(),
    unique: true,
  },
  accessedAt: Date,
  accessed: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = schema;
