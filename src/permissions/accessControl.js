'use strict';

const { ScopeResolver } = require('./scope');
const { getFieldPolicy, SCOPE_TYPES } = require('./policies');

class AccessControl {
  constructor(user) {
    this.user = user;
    this.scopeResolver = new ScopeResolver(user);
  }

  can(resourceType, action, resourceId = null) {
    if (!this.user || !this.user.active) return false;

    const scope = this.scopeResolver.resolve(resourceType, action);
    if (scope.type === SCOPE_TYPES.NONE) return false;
    if (scope.type === SCOPE_TYPES.ALL) return true;

    if (resourceId !== null) {
      return scope.ids && scope.ids.includes(Number(resourceId));
    }

    return scope.ids && scope.ids.length > 0;
  }

  getScope(resourceType, action) {
    return this.scopeResolver.resolve(resourceType, action);
  }

  canAccessResource(resourceType, action, resourceId) {
    return this.scopeResolver.canAccess(resourceType, action, resourceId);
  }

  filterFields(resourceType, data) {
    if (!data) return data;

    const fieldPolicy = getFieldPolicy(resourceType, this.user.role, this.user.userType);
    const { visible, sensitive } = fieldPolicy;

    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];

    const filtered = items.map((item) => {
      if (!item || typeof item !== 'object') return item;

      const result = {};
      for (const key of visible) {
        if (item.hasOwnProperty(key)) {
          result[key] = item[key];
        }
      }

      for (const key of sensitive) {
        if (item.hasOwnProperty(key)) {
          result[key] = null;
        }
      }

      return result;
    });

    return isArray ? filtered : filtered[0];
  }

  assert(resourceType, action, resourceId = null) {
    if (!this.can(resourceType, action, resourceId)) {
      const err = new Error('权限不足');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }

  assertAccess(resourceType, action, resourceId) {
    if (!this.canAccessResource(resourceType, action, resourceId)) {
      const err = new Error('无权访问该资源');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }
}

function createAccessControl(user) {
  return new AccessControl(user);
}

function withAccessControl(req, res, next) {
  if (req.user) {
    req.ac = new AccessControl(req.user);
  }
  next();
}

module.exports = {
  AccessControl,
  createAccessControl,
  withAccessControl,
};
