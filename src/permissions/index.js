'use strict';

const policies = require('./policies');
const scope = require('./scope');
const accessControl = require('./accessControl');
const filter = require('./filter');
const middleware = require('./middleware');

module.exports = {
  ...policies,
  ...scope,
  ...accessControl,
  ...filter,
  ...middleware,
};
