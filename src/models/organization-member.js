const mongoose = require('../connections/mongoose');
const schema = require('../schema/organization-member');

module.exports = mongoose.model('organization-member', schema);
