const deepAssign = require('deep-assign');
const { DateType, CursorType } = require('../custom-types');

const user = require('./user');
const story = require('./story');
const organization = require('./organization');
const project = require('./project');

module.exports = deepAssign(
  user,
  story,
  organization,
  project,
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
