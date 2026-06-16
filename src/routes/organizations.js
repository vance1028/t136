'use strict';

const express = require('express');
const store = require('../data/store');
const { authRequired } = require('../auth');
const { sendData, sendError, parseId } = require('../utils/http');
const {
  requirePermission,
  attachScope,
  RESOURCE_TYPES,
  ACTIONS,
  ORG_TYPES,
} = require('../permissions');

const router = express.Router();
const VALID_ORG_TYPES = [ORG_TYPES.COOP, ORG_TYPES.BUYER];

router.use(authRequired);

router.get(
  '/',
  attachScope(RESOURCE_TYPES.ORGANIZATION, ACTIONS.LIST),
  requirePermission(RESOURCE_TYPES.ORGANIZATION, ACTIONS.LIST),
  (req, res) => {
    const { type } = req.query;
    const filter = { scope: req.scope };
    if (type) filter.type = type;
    const data = store.listOrganizations(filter);
    const filtered = req.ac.filterFields(RESOURCE_TYPES.ORGANIZATION, data);
    return sendData(res, 200, filtered);
  }
);

router.get(
  '/:id',
  requirePermission(RESOURCE_TYPES.ORGANIZATION, ACTIONS.READ, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      const org = store.getOrganizationById(id);
      if (!org) return sendError(res, 404, '组织不存在');
      req.ac.assertAccess(RESOURCE_TYPES.ORGANIZATION, ACTIONS.READ, id);
      const filtered = req.ac.filterFields(RESOURCE_TYPES.ORGANIZATION, org);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

router.post(
  '/',
  requirePermission(RESOURCE_TYPES.ORGANIZATION, ACTIONS.CREATE),
  (req, res) => {
    const { code, name, type } = req.body || {};
    if (!code || !name || !type) {
      return sendError(res, 400, '编号、名称、类型不能为空');
    }
    if (!VALID_ORG_TYPES.includes(type)) {
      return sendError(res, 400, '非法的组织类型');
    }
    if (store.getOrganizationByCode(code)) {
      return sendError(res, 409, '组织编号已存在');
    }
    const org = store.createOrganization(req.body);
    const filtered = req.ac.filterFields(RESOURCE_TYPES.ORGANIZATION, org);
    return sendData(res, 201, filtered);
  }
);

router.put(
  '/:id',
  requirePermission(RESOURCE_TYPES.ORGANIZATION, ACTIONS.UPDATE, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getOrganizationById(id)) return sendError(res, 404, '组织不存在');
      req.ac.assertAccess(RESOURCE_TYPES.ORGANIZATION, ACTIONS.UPDATE, id);
      const org = store.updateOrganization(id, req.body || {});
      const filtered = req.ac.filterFields(RESOURCE_TYPES.ORGANIZATION, org);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

module.exports = router;
