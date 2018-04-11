const mongoose = require('mongoose');
const slug = require('slug');

const { Schema } = mongoose;

const schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: false,
  },
  slug: {
    type: String,
    required: false,
    trim: true,
    unique: true,
    lowercase: true,
  },
  text: {
    type: String,
    required: false,
    trim: false,
  },

}, { timestamps: true });

schema.pre('validate', function setSlug(next) {
  this.slug = slug(this.slug || this.title || '');
  next();
});

module.exports = schema;
