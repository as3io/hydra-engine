const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('../custom-types');

const user = require('./user');

module.exports = deepAssign(
  user,
  {
    /**
     *
     */
    Date: DateType,
    Cursor: CursorType,

    /**
     *
     */
    Query: {
      /**
       *
       */
      ping: () => 'pong',
    },
  },
);
