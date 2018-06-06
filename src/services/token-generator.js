const TokenGenerator = require('../factories/token-generator');
const env = require('../env');

module.exports = TokenGenerator({ secret: env.JWT_SECRET });
