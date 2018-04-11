const mongoose = require('mongoose');
const schema = require('../schema/project');

module.exports = mongoose.model('project', schema);
