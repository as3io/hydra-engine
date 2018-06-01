const mongoose = require('../connections/mongoose');
const schema = require('../schema/story');

module.exports = mongoose.model('story', schema);
