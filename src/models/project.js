const mongoose = require('../connections/mongoose');
const schema = require('../schema/project');

module.exports = mongoose.model('project', schema);
