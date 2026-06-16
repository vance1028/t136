'use strict';

const RESOURCE_TYPES = {
  ORGANIZATION: 'organization',
  USER: 'user',
  APIARY: 'apiary',
  HIVE: 'hive',
  INSPECTION: 'inspection',
  HARVEST: 'harvest',
  HARVEST_AUTH: 'harvest_auth',
};

const ACTIONS = {
  LIST: 'list',
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

const USER_TYPES = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
};

const ORG_TYPES = {
  COOP: 'cooperative',
  BUYER: 'buyer',
};

const SCOPE_TYPES = {
  ALL: 'all',
  ORG: 'org',
  OWNED: 'owned',
  AUTHORIZED: 'authorized',
  NONE: 'none',
};

const policies = {
  [RESOURCE_TYPES.USER]: {
    [ROLES.ADMIN]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.ORG,
      [ACTIONS.UPDATE]: SCOPE_TYPES.ORG,
      [ACTIONS.DELETE]: SCOPE_TYPES.ORG,
      fields: {
        visible: ['id', 'username', 'name', 'role', 'userType', 'orgId', 'active', 'createdAt', 'updatedAt'],
        sensitive: [],
      },
    },
    [ROLES.OPERATOR]: {
      [ACTIONS.LIST]: SCOPE_TYPES.OWNED,
      [ACTIONS.READ]: SCOPE_TYPES.OWNED,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'username', 'name', 'role', 'userType', 'orgId', 'active'],
        sensitive: [],
      },
    },
    [ROLES.VIEWER]: {
      [ACTIONS.LIST]: SCOPE_TYPES.NONE,
      [ACTIONS.READ]: SCOPE_TYPES.OWNED,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'name', 'role'],
        sensitive: [],
      },
    },
    external: {
      [ROLES.VIEWER]: {
        [ACTIONS.LIST]: SCOPE_TYPES.NONE,
        [ACTIONS.READ]: SCOPE_TYPES.NONE,
        [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
        [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
        [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
        fields: { visible: [], sensitive: [] },
      },
    },
  },

  [RESOURCE_TYPES.APIARY]: {
    [ROLES.ADMIN]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.ORG,
      [ACTIONS.UPDATE]: SCOPE_TYPES.ORG,
      [ACTIONS.DELETE]: SCOPE_TYPES.ORG,
      fields: {
        visible: ['id', 'code', 'name', 'location', 'district', 'ownerId', 'orgId', 'status', 'createdAt', 'updatedAt'],
        sensitive: [],
      },
    },
    [ROLES.OPERATOR]: {
      [ACTIONS.LIST]: SCOPE_TYPES.OWNED,
      [ACTIONS.READ]: SCOPE_TYPES.OWNED,
      [ACTIONS.CREATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.UPDATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'code', 'name', 'location', 'district', 'ownerId', 'orgId', 'status', 'createdAt', 'updatedAt'],
        sensitive: [],
      },
    },
    [ROLES.VIEWER]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'code', 'name', 'location', 'district', 'status'],
        sensitive: [],
      },
    },
    external: {
      [ROLES.VIEWER]: {
        [ACTIONS.LIST]: SCOPE_TYPES.NONE,
        [ACTIONS.READ]: SCOPE_TYPES.NONE,
        [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
        [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
        [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
        fields: { visible: [], sensitive: [] },
      },
    },
  },

  [RESOURCE_TYPES.HIVE]: {
    [ROLES.ADMIN]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.ORG,
      [ACTIONS.UPDATE]: SCOPE_TYPES.ORG,
      [ACTIONS.DELETE]: SCOPE_TYPES.ORG,
      fields: {
        visible: ['id', 'code', 'apiaryId', 'queenYear', 'frameCount', 'strength', 'status', 'installedAt', 'createdAt', 'updatedAt'],
        sensitive: [],
      },
    },
    [ROLES.OPERATOR]: {
      [ACTIONS.LIST]: SCOPE_TYPES.OWNED,
      [ACTIONS.READ]: SCOPE_TYPES.OWNED,
      [ACTIONS.CREATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.UPDATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'code', 'apiaryId', 'queenYear', 'frameCount', 'strength', 'status', 'installedAt', 'createdAt', 'updatedAt'],
        sensitive: [],
      },
    },
    [ROLES.VIEWER]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'code', 'apiaryId', 'strength', 'status'],
        sensitive: [],
      },
    },
    external: {
      [ROLES.VIEWER]: {
        [ACTIONS.LIST]: SCOPE_TYPES.NONE,
        [ACTIONS.READ]: SCOPE_TYPES.NONE,
        [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
        [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
        [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
        fields: { visible: [], sensitive: [] },
      },
    },
  },

  [RESOURCE_TYPES.INSPECTION]: {
    [ROLES.ADMIN]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.ORG,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'hiveId', 'inspectorId', 'inspectDate', 'hasQueen', 'broodFrames', 'honeyFrames', 'disease', 'note', 'createdAt'],
        sensitive: [],
      },
    },
    [ROLES.OPERATOR]: {
      [ACTIONS.LIST]: SCOPE_TYPES.OWNED,
      [ACTIONS.READ]: SCOPE_TYPES.OWNED,
      [ACTIONS.CREATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'hiveId', 'inspectorId', 'inspectDate', 'hasQueen', 'broodFrames', 'honeyFrames', 'disease', 'note', 'createdAt'],
        sensitive: [],
      },
    },
    [ROLES.VIEWER]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'hiveId', 'inspectDate', 'hasQueen', 'honeyFrames'],
        sensitive: ['disease', 'note', 'broodFrames'],
      },
    },
    external: {
      [ROLES.VIEWER]: {
        [ACTIONS.LIST]: SCOPE_TYPES.NONE,
        [ACTIONS.READ]: SCOPE_TYPES.NONE,
        [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
        [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
        [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
        fields: { visible: [], sensitive: [] },
      },
    },
  },

  [RESOURCE_TYPES.HARVEST]: {
    [ROLES.ADMIN]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.ORG,
      [ACTIONS.UPDATE]: SCOPE_TYPES.ORG,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'batchNo', 'apiaryId', 'harvestDate', 'product', 'quantityKg', 'internalCost', 'note', 'createdAt'],
        sensitive: [],
      },
    },
    [ROLES.OPERATOR]: {
      [ACTIONS.LIST]: SCOPE_TYPES.OWNED,
      [ACTIONS.READ]: SCOPE_TYPES.OWNED,
      [ACTIONS.CREATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.UPDATE]: SCOPE_TYPES.OWNED,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'batchNo', 'apiaryId', 'harvestDate', 'product', 'quantityKg', 'internalCost', 'note', 'createdAt'],
        sensitive: [],
      },
    },
    [ROLES.VIEWER]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'batchNo', 'apiaryId', 'harvestDate', 'product', 'quantityKg'],
        sensitive: ['internalCost', 'note'],
      },
    },
    external: {
      [ROLES.VIEWER]: {
        [ACTIONS.LIST]: SCOPE_TYPES.AUTHORIZED,
        [ACTIONS.READ]: SCOPE_TYPES.AUTHORIZED,
        [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
        [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
        [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
        fields: {
          visible: ['id', 'batchNo', 'harvestDate', 'product', 'quantityKg'],
          sensitive: ['apiaryId', 'internalCost', 'note'],
        },
      },
    },
  },

  [RESOURCE_TYPES.HARVEST_AUTH]: {
    [ROLES.ADMIN]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.ORG,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.ORG,
      fields: {
        visible: ['id', 'harvestId', 'buyerOrgId', 'authorizedBy', 'authorizedAt'],
        sensitive: [],
      },
    },
    [ROLES.OPERATOR]: {
      [ACTIONS.LIST]: SCOPE_TYPES.NONE,
      [ACTIONS.READ]: SCOPE_TYPES.NONE,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: { visible: [], sensitive: [] },
    },
    [ROLES.VIEWER]: {
      [ACTIONS.LIST]: SCOPE_TYPES.NONE,
      [ACTIONS.READ]: SCOPE_TYPES.NONE,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: { visible: [], sensitive: [] },
    },
    external: {
      [ROLES.VIEWER]: {
        [ACTIONS.LIST]: SCOPE_TYPES.NONE,
        [ACTIONS.READ]: SCOPE_TYPES.NONE,
        [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
        [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
        [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
        fields: { visible: [], sensitive: [] },
      },
    },
  },

  [RESOURCE_TYPES.ORGANIZATION]: {
    [ROLES.ADMIN]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ALL,
      [ACTIONS.READ]: SCOPE_TYPES.ALL,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.ORG,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'code', 'name', 'type', 'contact', 'phone', 'address', 'createdAt', 'updatedAt'],
        sensitive: [],
      },
    },
    [ROLES.OPERATOR]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'code', 'name', 'type'],
        sensitive: [],
      },
    },
    [ROLES.VIEWER]: {
      [ACTIONS.LIST]: SCOPE_TYPES.ORG,
      [ACTIONS.READ]: SCOPE_TYPES.ORG,
      [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
      [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
      [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
      fields: {
        visible: ['id', 'name', 'type'],
        sensitive: [],
      },
    },
    external: {
      [ROLES.VIEWER]: {
        [ACTIONS.LIST]: SCOPE_TYPES.OWNED,
        [ACTIONS.READ]: SCOPE_TYPES.OWNED,
        [ACTIONS.CREATE]: SCOPE_TYPES.NONE,
        [ACTIONS.UPDATE]: SCOPE_TYPES.NONE,
        [ACTIONS.DELETE]: SCOPE_TYPES.NONE,
        fields: {
          visible: ['id', 'name', 'type'],
          sensitive: [],
        },
      },
    },
  },
};

function getPolicy(resourceType, userRole, userType) {
  const resourcePolicy = policies[resourceType];
  if (!resourcePolicy) return null;

  if (userType === USER_TYPES.EXTERNAL) {
    return resourcePolicy.external && resourcePolicy.external[userRole]
      ? resourcePolicy.external[userRole]
      : null;
  }

  return resourcePolicy[userRole] || null;
}

function getAllowedScope(resourceType, userRole, userType, action) {
  const policy = getPolicy(resourceType, userRole, userType);
  if (!policy) return SCOPE_TYPES.NONE;
  return policy[action] || SCOPE_TYPES.NONE;
}

function getFieldPolicy(resourceType, userRole, userType) {
  const policy = getPolicy(resourceType, userRole, userType);
  if (!policy) return { visible: [], sensitive: [] };
  return policy.fields || { visible: [], sensitive: [] };
}

module.exports = {
  RESOURCE_TYPES,
  ACTIONS,
  ROLES,
  USER_TYPES,
  ORG_TYPES,
  SCOPE_TYPES,
  policies,
  getPolicy,
  getAllowedScope,
  getFieldPolicy,
};
