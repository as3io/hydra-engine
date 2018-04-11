const mongoose = require('mongoose');
const schema = require('../schema/organization');

module.exports = mongoose.model('organization', schema);
