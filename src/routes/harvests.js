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

/** GET /api/harvests —— 采收批次列表，自动行级过滤。 */
router.get(
  '/',
  attachScope(RESOURCE_TYPES.HARVEST, ACTIONS.LIST),
  requirePermission(RESOURCE_TYPES.HARVEST, ACTIONS.LIST),
  (req, res) => {
    const { apiaryId, product } = req.query;
    const filter = { product };
    if (apiaryId !== undefined) filter.apiaryId = Number(apiaryId);
    filter.scope = req.scope;
    const data = store.listHarvests(filter);
    const filtered = req.ac.filterFields(RESOURCE_TYPES.HARVEST, data);
    return sendData(res, 200, filtered);
  }
);

/** GET /api/harvests/:id —— 采收批次详情，越权拦截 + 字段脱敏。 */
router.get(
  '/:id',
  requirePermission(RESOURCE_TYPES.HARVEST, ACTIONS.READ, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      const harvest = store.getHarvestById(id);
      if (!harvest) return sendError(res, 404, '采收批次不存在');
      req.ac.assertAccess(RESOURCE_TYPES.HARVEST, ACTIONS.READ, id);
      const filtered = req.ac.filterFields(RESOURCE_TYPES.HARVEST, harvest);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

/** POST /api/harvests —— 登记一条采收批次。 */
router.post(
  '/',
  requirePermission(RESOURCE_TYPES.HARVEST, ACTIONS.CREATE),
  (req, res) => {
    const { batchNo, apiaryId, harvestDate } = req.body || {};
    if (!batchNo || apiaryId === undefined || !harvestDate) {
      return sendError(res, 400, '批次号、所属蜂场、采收日期不能为空');
    }
    const apiary = store.getApiaryById(Number(apiaryId));
    if (!apiary) return sendError(res, 400, '所属蜂场不存在');
    req.ac.assertAccess(RESOURCE_TYPES.APIARY, ACTIONS.READ, apiaryId);
    if (store.getHarvestByBatchNo(batchNo)) return sendError(res, 409, '批次号已存在');
    const harvest = store.createHarvest({ ...req.body, apiaryId: Number(apiaryId) });
    const filtered = req.ac.filterFields(RESOURCE_TYPES.HARVEST, harvest);
    return sendData(res, 201, filtered);
  }
);

/** POST /api/harvests/:id/authorize —— 授权某收购方可见该批次。 */
router.post(
  '/:id/authorize',
  requirePermission(RESOURCE_TYPES.HARVEST_AUTH, ACTIONS.CREATE),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      const { buyerOrgId } = req.body || {};
      if (!buyerOrgId) return sendError(res, 400, '收购方组织ID不能为空');
      const harvest = store.getHarvestById(id);
      if (!harvest) return sendError(res, 404, '采收批次不存在');
      req.ac.assertAccess(RESOURCE_TYPES.HARVEST, ACTIONS.READ, id);
      if (!store.getOrganizationById(Number(buyerOrgId))) {
        return sendError(res, 400, '收购方组织不存在');
      }
      if (store.getHarvestAuth(id, Number(buyerOrgId))) {
        return sendError(res, 409, '该批次已授权给此收购方');
      }
      const auth = store.createHarvestAuth({
        harvestId: id,
        buyerOrgId: Number(buyerOrgId),
        authorizedBy: req.user.id,
      });
      return sendData(res, 201, auth);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

module.exports = router;
