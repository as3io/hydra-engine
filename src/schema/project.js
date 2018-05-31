const { Schema } = require('mongoose');

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'organization',
    required: true,
  },
}, { timestamps: true });

schema.index({ organizationId: 1 });

module.exports = schema;
