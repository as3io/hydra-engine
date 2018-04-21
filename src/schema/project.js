const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'organization',
    required: true,
  },

}, { timestamps: true });

module.exports = schema;
