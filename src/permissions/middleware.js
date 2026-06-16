'use strict';

const { sendError } = require('../utils/http');
const { withAccessControl } = require('./accessControl');
const { RESOURCE_TYPES, ACTIONS } = require('./policies');

function requirePermission(resourceType, action, idParam = null) {
  return (req, res, next) => {
    if (!req.ac) {
      return sendError(res, 401, '未认证');
    }

    let resourceId = null;
    if (idParam) {
      resourceId = req.params[idParam];
    }

    try {
      if (resourceId !== null && resourceId !== undefined) {
        req.ac.assertAccess(resourceType, action, resourceId);
      } else {
        req.ac.assert(resourceType, action);
      }
      next();
    } catch (e) {
      return sendError(res, e.statusCode || 403, e.message);
    }
  };
}

function attachScope(resourceType, action) {
  return (req, res, next) => {
    if (req.ac) {
      req.scope = req.ac.getScope(resourceType, action);
    }
    next();
  };
}

function permissionGate(resourceType, action) {
  return [withAccessControl, requirePermission(resourceType, action)];
}

function resourceGate(resourceType, action, idParam) {
  return [withAccessControl, requirePermission(resourceType, action, idParam)];
}

module.exports = {
  requirePermission,
  attachScope,
  permissionGate,
  resourceGate,
  RESOURCE_TYPES,
  ACTIONS,
};
