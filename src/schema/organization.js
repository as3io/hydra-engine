const mongoose = require('mongoose');
const validator = require('validator');
const paginablePlugin = require('../plugins/paginable');

const { Schema } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  photoURL: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return validator.isURL(v, {
          protocols: ['https'],
          require_protocol: true,
        });
      },
      message: 'Invalid photo URL for {VALUE}',
    },
  },
}, { timestamps: true });

schema.plugin(paginablePlugin);

schema.pre('save', function setPhotoURL(next) {
  if (!this.photoURL) {
    const hash = this.id;
    this.photoURL = `https://robohash.org/${hash}?set=set3&bgset=bg2`;
  }
  next();
});

module.exports = schema;
