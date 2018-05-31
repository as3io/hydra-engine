const { Schema } = require('mongoose');

const schema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
});

schema.index({ 'payload.jti': 1 }, { unique: true });
schema.index({ action: 1 });

module.exports = schema;
