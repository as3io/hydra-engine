const { BasicStrategy } = require('passport-http');
const Key = require('../models/key');

module.exports = new BasicStrategy((value, pwd, next) => {
  Key.findOne({ value }).then(key => next(null, { key })).catch(() => {
    next(new Error('Invalid API Key'));
  });
});
