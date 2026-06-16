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

/** GET /api/hives —— 蜂箱列表，自动行级过滤。 */
router.get(
  '/',
  attachScope(RESOURCE_TYPES.HIVE, ACTIONS.LIST),
  requirePermission(RESOURCE_TYPES.HIVE, ACTIONS.LIST),
  (req, res) => {
    const { apiaryId, status, keyword } = req.query;
    const filter = { status, keyword };
    if (apiaryId !== undefined) filter.apiaryId = Number(apiaryId);
    filter.scope = req.scope;
    const data = store.listHives(filter);
    const filtered = req.ac.filterFields(RESOURCE_TYPES.HIVE, data);
    return sendData(res, 200, filtered);
  }
);

/** GET /api/hives/:id —— 蜂箱详情，越权拦截 + 字段脱敏。 */
router.get(
  '/:id',
  requirePermission(RESOURCE_TYPES.HIVE, ACTIONS.READ, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      const hive = store.getHiveById(id);
      if (!hive) return sendError(res, 404, '蜂箱不存在');
      req.ac.assertAccess(RESOURCE_TYPES.HIVE, ACTIONS.READ, id);
      const filtered = req.ac.filterFields(RESOURCE_TYPES.HIVE, hive);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

/** GET /api/hives/:id/inspections —— 某蜂箱的检查记录，自动行级过滤 + 字段脱敏。 */
router.get(
  '/:id/inspections',
  requirePermission(RESOURCE_TYPES.HIVE, ACTIONS.READ, 'id'),
  attachScope(RESOURCE_TYPES.INSPECTION, ACTIONS.LIST),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getHiveById(id)) return sendError(res, 404, '蜂箱不存在');
      req.ac.assertAccess(RESOURCE_TYPES.HIVE, ACTIONS.READ, id);
      const data = store.listInspections({ hiveId: id, scope: req.scope });
      const filtered = req.ac.filterFields(RESOURCE_TYPES.INSPECTION, data);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

/** POST /api/hives/:id/inspections —— 为某蜂箱登记一条检查记录。 */
router.post(
  '/:id/inspections',
  requirePermission(RESOURCE_TYPES.INSPECTION, ACTIONS.CREATE),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      const hive = store.getHiveById(id);
      if (!hive) return sendError(res, 404, '蜂箱不存在');
      req.ac.assertAccess(RESOURCE_TYPES.HIVE, ACTIONS.READ, id);
      const { inspectDate } = req.body || {};
      if (!inspectDate) return sendError(res, 400, '检查日期不能为空');
      const rec = store.createInspection({ ...req.body, hiveId: id, inspectorId: req.user.id });
      const filtered = req.ac.filterFields(RESOURCE_TYPES.INSPECTION, rec);
      return sendData(res, 201, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

router.post(
  '/',
  requirePermission(RESOURCE_TYPES.HIVE, ACTIONS.CREATE),
  (req, res) => {
    const { code, apiaryId } = req.body || {};
    if (!code || apiaryId === undefined) return sendError(res, 400, '编号和所属蜂场不能为空');
    const apiary = store.getApiaryById(Number(apiaryId));
    if (!apiary) return sendError(res, 400, '所属蜂场不存在');
    req.ac.assertAccess(RESOURCE_TYPES.APIARY, ACTIONS.READ, apiaryId);
    if (store.getHiveByCode(code)) return sendError(res, 409, '蜂箱编号已存在');
    const hive = store.createHive({ ...req.body, apiaryId: Number(apiaryId) });
    const filtered = req.ac.filterFields(RESOURCE_TYPES.HIVE, hive);
    return sendData(res, 201, filtered);
  }
);

router.put(
  '/:id',
  requirePermission(RESOURCE_TYPES.HIVE, ACTIONS.UPDATE, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getHiveById(id)) return sendError(res, 404, '蜂箱不存在');
      req.ac.assertAccess(RESOURCE_TYPES.HIVE, ACTIONS.UPDATE, id);
      const hive = store.updateHive(id, req.body || {});
      const filtered = req.ac.filterFields(RESOURCE_TYPES.HIVE, hive);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

router.delete(
  '/:id',
  requirePermission(RESOURCE_TYPES.HIVE, ACTIONS.DELETE, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getHiveById(id)) return sendError(res, 404, '蜂箱不存在');
      req.ac.assertAccess(RESOURCE_TYPES.HIVE, ACTIONS.DELETE, id);
      store.deleteHive(id);
      return sendData(res, 200, { id });
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

module.exports = router;
