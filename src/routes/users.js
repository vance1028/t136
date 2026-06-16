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
  ROLES,
  USER_TYPES,
} = require('../permissions');

const router = express.Router();
const VALID_ROLES = [ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER];
const VALID_USER_TYPES = [USER_TYPES.INTERNAL, USER_TYPES.EXTERNAL];

router.use(authRequired);

router.get(
  '/',
  attachScope(RESOURCE_TYPES.USER, ACTIONS.LIST),
  requirePermission(RESOURCE_TYPES.USER, ACTIONS.LIST),
  (req, res) => {
    const { role, userType, orgId } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (userType) filter.userType = userType;
    if (orgId !== undefined) filter.orgId = Number(orgId);
    filter.scope = req.scope;
    const data = store.listUsers(filter);
    const filtered = req.ac.filterFields(RESOURCE_TYPES.USER, data);
    return sendData(res, 200, filtered);
  }
);

router.get(
  '/:id',
  requirePermission(RESOURCE_TYPES.USER, ACTIONS.READ, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      const user = store.getUserById(id);
      if (!user) return sendError(res, 404, '用户不存在');
      req.ac.assertAccess(RESOURCE_TYPES.USER, ACTIONS.READ, id);
      const filtered = req.ac.filterFields(RESOURCE_TYPES.USER, user);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

router.post(
  '/',
  requirePermission(RESOURCE_TYPES.USER, ACTIONS.CREATE),
  (req, res) => {
    const { username, password, name, role = ROLES.VIEWER, userType = USER_TYPES.INTERNAL, orgId, active = true } = req.body || {};
    if (!username || !password || !name) return sendError(res, 400, '用户名、密码、姓名不能为空');
    if (!VALID_ROLES.includes(role)) return sendError(res, 400, '非法的角色');
    if (!VALID_USER_TYPES.includes(userType)) return sendError(res, 400, '非法的用户类型');
    if (store.getUserByUsername(username)) return sendError(res, 409, '用户名已存在');
    const createData = { username, password, name, role, userType, active };
    if (orgId !== undefined) createData.orgId = Number(orgId);
    else if (req.user.role === ROLES.ADMIN && req.user.orgId) {
      createData.orgId = req.user.orgId;
    }
    const user = store.createUser(createData);
    const filtered = req.ac.filterFields(RESOURCE_TYPES.USER, user);
    return sendData(res, 201, filtered);
  }
);

router.put(
  '/:id',
  requirePermission(RESOURCE_TYPES.USER, ACTIONS.UPDATE, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!store.getUserById(id)) return sendError(res, 404, '用户不存在');
      req.ac.assertAccess(RESOURCE_TYPES.USER, ACTIONS.UPDATE, id);
      const { role, userType } = req.body || {};
      if (role !== undefined && !VALID_ROLES.includes(role)) return sendError(res, 400, '非法的角色');
      if (userType !== undefined && !VALID_USER_TYPES.includes(userType)) return sendError(res, 400, '非法的用户类型');
      const user = store.updateUser(id, req.body || {});
      const filtered = req.ac.filterFields(RESOURCE_TYPES.USER, user);
      return sendData(res, 200, filtered);
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

router.delete(
  '/:id',
  requirePermission(RESOURCE_TYPES.USER, ACTIONS.DELETE, 'id'),
  (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (id === req.user.id) return sendError(res, 400, '不能删除当前登录用户');
      if (!store.getUserById(id)) return sendError(res, 404, '用户不存在');
      req.ac.assertAccess(RESOURCE_TYPES.USER, ACTIONS.DELETE, id);
      store.deleteUser(id);
      return sendData(res, 200, { id });
    } catch (e) {
      return sendError(res, e.statusCode || 500, e.message);
    }
  }
);

module.exports = router;
