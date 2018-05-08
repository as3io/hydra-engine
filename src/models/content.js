const mongoose = require('../connections/mongoose');
const schema = require('../schema/content');

module.exports = mongoose.model('content', schema);
