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
} = require('../permissions');

const router = express.Router();

router.use(authRequired);

/** GET /api/apiaries —— 蜂场列表，自动行级过滤。 */
router.get(
  '/',
  attachScope(RESOURCE_TYPES.APIARY, ACTIONS.LIST),
  requirePermission(RESOURCE_TYPES.APIARY, ACTIONS.LIST),
  (req, res) => {
    const { district, status, keyword } = req.query;
    const data = store.listApiaries({ district, status, keyword, scope: req.scope });
    const filtered = req.ac.filterFields(RESOURCE_TYPES.APIARY, data);
    return sendData(res, 200, filtered);
  }
);

/** GET /api/apiaries/:id —— 蜂场详情，越权拦截 + 字段脱敏。 */
router.get(
  '/:id',
  requirePermission(RESOURCE_TYPES.APIARY, ACTIONS.READ, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      const apiary = store.getApiaryById(id);
      if (!apiary) return sendError(res, 404, '蜂场不存在');
      req.ac.assertAccess(RESOURCE_TYPES.APIARY, ACTIONS.READ, id);
      const filtered = req.ac.filterFields(RESOURCE_TYPES.APIARY, apiary);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

/** GET /api/apiaries/:id/hives —— 某蜂场的蜂箱列表，自动行级过滤。 */
router.get(
  '/:id/hives',
  requirePermission(RESOURCE_TYPES.APIARY, ACTIONS.READ, 'id'),
  attachScope(RESOURCE_TYPES.HIVE, ACTIONS.LIST),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getApiaryById(id)) return sendError(res, 404, '蜂场不存在');
      req.ac.assertAccess(RESOURCE_TYPES.APIARY, ACTIONS.READ, id);
      const data = store.listHives({ apiaryId: id, scope: req.scope });
      const filtered = req.ac.filterFields(RESOURCE_TYPES.HIVE, data);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

router.post(
  '/',
  requirePermission(RESOURCE_TYPES.APIARY, ACTIONS.CREATE),
  (req, res) => {
    const { code, name, location, district } = req.body || {};
    if (!code || !name || !location || !district) {
      return sendError(res, 400, '编号、名称、地点、区域不能为空');
    }
    if (store.getApiaryByCode(code)) return sendError(res, 409, '蜂场编号已存在');
    const createData = { ...req.body };
    if (req.user.role === 'operator') {
      createData.ownerId = req.user.id;
      createData.orgId = req.user.orgId;
    }
    const apiary = store.createApiary(createData);
    const filtered = req.ac.filterFields(RESOURCE_TYPES.APIARY, apiary);
    return sendData(res, 201, filtered);
  }
);

router.put(
  '/:id',
  requirePermission(RESOURCE_TYPES.APIARY, ACTIONS.UPDATE, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getApiaryById(id)) return sendError(res, 404, '蜂场不存在');
      req.ac.assertAccess(RESOURCE_TYPES.APIARY, ACTIONS.UPDATE, id);
      const apiary = store.updateApiary(id, req.body || {});
      const filtered = req.ac.filterFields(RESOURCE_TYPES.APIARY, apiary);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

router.delete(
  '/:id',
  requirePermission(RESOURCE_TYPES.APIARY, ACTIONS.DELETE, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getApiaryById(id)) return sendError(res, 404, '蜂场不存在');
      req.ac.assertAccess(RESOURCE_TYPES.APIARY, ACTIONS.DELETE, id);
      store.deleteApiary(id);
      return sendData(res, 200, { id });
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

module.exports = router;
