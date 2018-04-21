const mongoose = require('mongoose');
const validator = require('validator');

const { Schema } = mongoose;

const role = {
  type: String,
  required: true,
  default: 'Member',
  enum: [
    'Owner',
    'Administrator',
    'Member',
  ],
};

const projectRole = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project',
  },
  role,
});

const orgMember = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  role,
  invited: {
    type: Date,
    default: () => new Date(),
  },
  accepted: Date,
  projects: [projectRole],
});

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  members: [orgMember],
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
}, { timestamps: true });

schema.pre('save', function setPhotoURL(next) {
  if (!this.photoURL) {
    const hash = this.id;
    this.photoURL = `https://robohash.org/${hash}?set=set3&bgset=bg2`;
  }
  next();
});

module.exports = schema;
