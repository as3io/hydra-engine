const mongoose = require('../connections/mongoose');
const schema = require('../schema/key');

module.exports = mongoose.model('key', schema);
