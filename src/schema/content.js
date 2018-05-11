const mongoose = require('mongoose');
const slug = require('slug');
const Project = require('../models/project');

const { Schema } = mongoose;

const schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  teaser: String,
  slug: {
    type: String,
    trim: true,
    lowercase: true,
  },
  text: String,
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project',
    required: true,
    validate: {
      async validator(v) {
        const doc = await Project.findOne({ _id: v }, { _id: 1 });
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
