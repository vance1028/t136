'use strict';

const { getDb } = require('../db');
const { SCOPE_TYPES, RESOURCE_TYPES, getAllowedScope } = require('./policies');

class ScopeResolver {
  constructor(user) {
    this.user = user;
    this.db = getDb();
  }

  resolve(resourceType, action) {
    const scopeType = getAllowedScope(resourceType, this.user.role, this.user.userType, action);

    switch (scopeType) {
      case SCOPE_TYPES.ALL:
        return { type: SCOPE_TYPES.ALL, ids: null };
      case SCOPE_TYPES.ORG:
        return this._resolveOrgScope(resourceType);
      case SCOPE_TYPES.OWNED:
        return this._resolveOwnedScope(resourceType);
      case SCOPE_TYPES.AUTHORIZED:
        return this._resolveAuthorizedScope(resourceType);
      case SCOPE_TYPES.NONE:
      default:
        return { type: SCOPE_TYPES.NONE, ids: [] };
    }
  }

  canAccess(resourceType, action, resourceId) {
    const scope = this.resolve(resourceType, action);
    if (scope.type === SCOPE_TYPES.ALL) return true;
    if (scope.type === SCOPE_TYPES.NONE || !scope.ids) return false;
    return scope.ids.includes(Number(resourceId));
  }

  _resolveOrgScope(resourceType) {
    const orgId = this.user.orgId;
    if (!orgId) return { type: SCOPE_TYPES.NONE, ids: [] };

    let ids;
    switch (resourceType) {
      case RESOURCE_TYPES.ORGANIZATION:
        ids = [orgId];
        break;
      case RESOURCE_TYPES.USER:
        ids = this.db
          .prepare('SELECT id FROM users WHERE org_id = ?')
          .all(orgId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.APIARY:
        ids = this.db
          .prepare('SELECT id FROM apiaries WHERE org_id = ?')
          .all(orgId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.HIVE:
        ids = this.db
          .prepare(
            `SELECT h.id FROM hives h
             JOIN apiaries a ON h.apiary_id = a.id
             WHERE a.org_id = ?`
          )
          .all(orgId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.INSPECTION:
        ids = this.db
          .prepare(
            `SELECT i.id FROM inspections i
             JOIN hives h ON i.hive_id = h.id
             JOIN apiaries a ON h.apiary_id = a.id
             WHERE a.org_id = ?`
          )
          .all(orgId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.HARVEST:
        ids = this.db
          .prepare(
            `SELECT hv.id FROM harvests hv
             JOIN apiaries a ON hv.apiary_id = a.id
             WHERE a.org_id = ?`
          )
          .all(orgId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.HARVEST_AUTH:
        ids = this.db
          .prepare(
            `SELECT ha.id FROM harvest_authorizations ha
             JOIN harvests hv ON ha.harvest_id = hv.id
             JOIN apiaries a ON hv.apiary_id = a.id
             WHERE a.org_id = ?`
          )
          .all(orgId)
          .map((r) => r.id);
        break;
      default:
        ids = [];
    }
    return { type: SCOPE_TYPES.ORG, ids };
  }

  _resolveOwnedScope(resourceType) {
    const userId = this.user.id;
    const orgId = this.user.orgId;

    let ids;
    switch (resourceType) {
      case RESOURCE_TYPES.ORGANIZATION:
        ids = orgId ? [orgId] : [];
        break;
      case RESOURCE_TYPES.USER:
        ids = [userId];
        break;
      case RESOURCE_TYPES.APIARY:
        ids = this.db
          .prepare('SELECT id FROM apiaries WHERE owner_id = ?')
          .all(userId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.HIVE:
        ids = this.db
          .prepare(
            `SELECT h.id FROM hives h
             JOIN apiaries a ON h.apiary_id = a.id
             WHERE a.owner_id = ?`
          )
          .all(userId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.INSPECTION:
        ids = this.db
          .prepare(
            `SELECT i.id FROM inspections i
             JOIN hives h ON i.hive_id = h.id
             JOIN apiaries a ON h.apiary_id = a.id
             WHERE a.owner_id = ? OR i.inspector_id = ?`
          )
          .all(userId, userId)
          .map((r) => r.id);
        break;
      case RESOURCE_TYPES.HARVEST:
        ids = this.db
          .prepare(
            `SELECT hv.id FROM harvests hv
             JOIN apiaries a ON hv.apiary_id = a.id
             WHERE a.owner_id = ?`
          )
          .all(userId)
          .map((r) => r.id);
        break;
      default:
        ids = [];
    }
    return { type: SCOPE_TYPES.OWNED, ids };
  }

  _resolveAuthorizedScope(resourceType) {
    const orgId = this.user.orgId;
    if (!orgId) return { type: SCOPE_TYPES.NONE, ids: [] };

    let ids;
    switch (resourceType) {
      case RESOURCE_TYPES.HARVEST:
        ids = this.db
          .prepare(
            `SELECT hv.id FROM harvests hv
             JOIN harvest_authorizations ha ON hv.id = ha.harvest_id
             WHERE ha.buyer_org_id = ?`
          )
          .all(orgId)
          .map((r) => r.id);
        break;
      default:
        ids = [];
    }
    return { type: SCOPE_TYPES.AUTHORIZED, ids };
  }
}

function buildScopeFilter(scope, idColumn = 'id') {
  if (!scope) return '';
  if (scope.type === SCOPE_TYPES.ALL) return '';
  if (scope.type === SCOPE_TYPES.NONE || !scope.ids || scope.ids.length === 0) {
    return `AND ${idColumn} IN (SELECT 1 WHERE 1 = 0)`;
  }
  const placeholders = scope.ids.map(() => '?').join(',');
  return { clause: `AND ${idColumn} IN (${placeholders})`, params: scope.ids };
}

function applyScopeToQuery(baseSql, scope, idColumn = 'id') {
  const filter = buildScopeFilter(scope, idColumn);
  if (typeof filter === 'string') {
    return { sql: baseSql + filter, params: [] };
  }
  return { sql: baseSql + ' ' + filter.clause, params: filter.params };
}

module.exports = {
  ScopeResolver,
  buildScopeFilter,
  applyScopeToQuery,
};
