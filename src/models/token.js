const mongoose = require('../connections/mongoose');
const schema = require('../schema/token');

module.exports = mongoose.model('token', schema);
