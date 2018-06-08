const { Schema } = require('mongoose');
const connection = require('../connections/mongoose');
const paginablePlugin = require('../plugins/paginable');
const repositoryPlugin = require('../plugins/repository');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
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
}, { timestamps: true });

schema.plugin(paginablePlugin);
schema.plugin(repositoryPlugin);

schema.index({ organizationId: 1 });

module.exports = schema;
