const { Schema } = require('mongoose');

const schema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
  },
});

schema.index({ 'payload.jti': 1 }, { unique: true });

module.exports = schema;
