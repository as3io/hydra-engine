const mongoose = require('mongoose');
const slug = require('slug');

const { Schema } = mongoose;

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
        const doc = await mongoose.model('project').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No project found for ID {VALUE}',
    },
  },

}, { timestamps: true });

schema.pre('validate', function setSlug(next) {
  this.slug = slug(this.slug || this.title || '');
  next();
});

module.exports = schema;
