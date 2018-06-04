const { Schema } = require('mongoose');
const connection = require('../connections/mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const crypto = require('crypto');
const uuid = require('uuid/v4');
const pushId = require('unique-push-id');
const paginablePlugin = require('../plugins/paginable');

const apiSchema = new Schema({
  key: {
    type: String,
    required: true,
    default: () => uuid(),
  },
  secret: {
    type: String,
    required: true,
    default: () => pushId(),
  },
});

const schema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate: [
      {
        validator(email) {
          return validator.isEmail(email);
        },
        message: 'Invalid email address {VALUE}',
      },
    ],
  },
  api: {
    type: apiSchema,
  },
  givenName: {
    type: String,
    required: true,
    trim: true,
  },
  familyName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  logins: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastLoggedInAt: {
    type: Date,
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  photoURL: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid photo URL for {VALUE}',
    },
  },
}, {
  timestamps: true,
});

schema.plugin(paginablePlugin);

schema.statics.normalizeEmail = function normalizeEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
};

schema.statics.findByEmail = async function findByEmail(value) {
  const email = connection.model('user').normalizeEmail(value);
  if (!email) throw new Error('Unable to find user: no email address was provided.');
  return this.findOne({ email });
};

/**
 * Indexes
 */
schema.index({ email: 1, isEmailVerified: 1 });

schema.virtual('toAddress').get(function toAddress() {
  return `${this.givenName} ${this.familyName} <${this.email}>`;
});

/**
 * Hooks.
 */
schema.pre('save', function setPassword(next) {
  if (!this.isModified('password')) {
    next();
  } else {
    bcrypt.hash(this.password, 13).then((hash) => {
      this.password = hash;
      next();
    }).catch(next);
  }
});
schema.pre('save', function setPhotoURL(next) {
  if (!this.photoURL) {
    const hash = crypto.createHash('md5').update(this.email).digest('hex');
    this.photoURL = `https://www.gravatar.com/avatar/${hash}`;
  }
  next();
});

module.exports = schema;
