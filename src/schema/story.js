const { Schema } = require('mongoose');
const connection = require('../connections/mongoose');
const slug = require('slug');

const schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  teaser: {
    type: String,
    trim: true,
  },
  body: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
  },
  published: {
    type: Boolean,
    required: true,
    default: false,
  },
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

}, { timestamps: true });

schema.index({ projectId: 1 });
schema.index({ published: 1 });

schema.pre('validate', function setSlug(next) {
  this.slug = slug(this.slug || this.title || '');
  next();
});

module.exports = schema;
