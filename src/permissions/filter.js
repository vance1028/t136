'use strict';

const { SCOPE_TYPES } = require('./policies');
const { buildScopeFilter } = require('./scope');

function filterByScope(records, scope, idField = 'id') {
  if (!records || !Array.isArray(records)) return records;

  if (scope.type === SCOPE_TYPES.ALL) return records;
  if (scope.type === SCOPE_TYPES.NONE || !scope.ids) return [];

  const allowedIds = new Set(scope.ids.map(Number));
  return records.filter((r) => allowedIds.has(Number(r[idField])));
}

function buildWhereWithScope(baseWhere, scope, idColumn = 'id') {
  const filter = buildScopeFilter(scope, idColumn);
  if (typeof filter === 'string') {
    return { clause: baseWhere + filter, params: [] };
  }
  const whereClause = baseWhere
    ? `${baseWhere} ${filter.clause}`
    : `WHERE 1=1 ${filter.clause}`;
  return { clause: whereClause, params: filter.params };
}

function redactSensitiveFields(obj, visibleFields, sensitiveFields) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = {};
  for (const key of visibleFields) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }
  for (const key of sensitiveFields) {
    if (obj.hasOwnProperty(key)) {
      result[key] = null;
    }
  }
  return result;
}

module.exports = {
  filterByScope,
  buildWhereWithScope,
  redactSensitiveFields,
};
