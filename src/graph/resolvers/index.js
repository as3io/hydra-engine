const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('../custom-types');

const user = require('./user');
const story = require('./story');

module.exports = deepAssign(
  user,
  story,
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
