const mongoose = require('mongoose');
const bluebird = require('bluebird');
const env = require('../../env');

const { MONGO_DSN, MONGOOSE_DEBUG } = env;
mongoose.set('debug', Boolean(MONGOOSE_DEBUG));
mongoose.Promise = bluebird;

const connection = mongoose.createConnection(MONGO_DSN, {
  // autoIndex: process.env.NODE_ENV !== 'production',
  ignoreUndefined: true,
  promiseLibrary: bluebird,
});

connection.once('open', () => {
  process.stdout.write(`Successful MongoDB connection to '${MONGO_DSN}'\n`);
});

module.exports = connection;
