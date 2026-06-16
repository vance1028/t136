'use strict';

const { getDb } = require('../db');
const { hashPassword } = require('../utils/password');
const { buildWhereWithScope, SCOPE_TYPES } = require('../permissions');

/**
 * 数据仓储层：SQL 集中在这里，路由层只调用方法。
 * 对外统一返回 camelCase 字段对象。
 * 所有 list 方法支持 scope 参数进行行级过滤。
 */

/* ----------------------------- 映射 ----------------------------- */

function mapOrganization(r) {
  if (!r) return null;
  return {
    id: r.id, code: r.code, name: r.name, type: r.type,
    contact: r.contact, phone: r.phone, address: r.address,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapUser(r) {
  if (!r) return null;
  return {
    id: r.id, username: r.username, name: r.name, role: r.role,
    orgId: r.org_id, userType: r.user_type,
    active: !!r.active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapApiary(r) {
  if (!r) return null;
  return {
    id: r.id, code: r.code, name: r.name, location: r.location,
    district: r.district, ownerId: r.owner_id, orgId: r.org_id, status: r.status,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapHive(r) {
  if (!r) return null;
  return {
    id: r.id, code: r.code, apiaryId: r.apiary_id, queenYear: r.queen_year,
    frameCount: r.frame_count, strength: r.strength, status: r.status,
    installedAt: r.installed_at, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapInspection(r) {
  if (!r) return null;
  return {
    id: r.id, hiveId: r.hive_id, inspectorId: r.inspector_id, inspectDate: r.inspect_date,
    hasQueen: !!r.has_queen, broodFrames: r.brood_frames, honeyFrames: r.honey_frames,
    disease: r.disease, note: r.note, createdAt: r.created_at,
  };
}

function mapHarvest(r) {
  if (!r) return null;
  return {
    id: r.id, batchNo: r.batch_no, apiaryId: r.apiary_id, harvestDate: r.harvest_date,
    product: r.product, quantityKg: r.quantity_kg, internalCost: r.internal_cost,
    note: r.note, createdAt: r.created_at,
  };
}

function mapHarvestAuth(r) {
  if (!r) return null;
  return {
    id: r.id, harvestId: r.harvest_id, buyerOrgId: r.buyer_org_id,
    authorizedBy: r.authorized_by, authorizedAt: r.authorized_at,
  };
}

/* ----------------------------- 工具 ----------------------------- */

function _buildWhere(filters, scope, idColumn = 'id') {
  const where = [];
  const params = [];
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined) continue;
    where.push(`${k} = ?`);
    params.push(v);
  }
  const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
  if (scope) {
    const scoped = buildWhereWithScope(baseWhere, scope, idColumn);
    return { clause: scoped.clause, params: [...params, ...scoped.params] };
  }
  return { clause: baseWhere, params };
}

/* ----------------------------- 组织 ----------------------------- */

function getOrganizationById(id) {
  return mapOrganization(getDb().prepare('SELECT * FROM organizations WHERE id = ?').get(id));
}
function getOrganizationByCode(code) {
  return mapOrganization(getDb().prepare('SELECT * FROM organizations WHERE code = ?').get(code));
}
function listOrganizations({ type, scope } = {}) {
  const { clause, params } = _buildWhere({ type }, scope);
  return getDb()
    .prepare(`SELECT * FROM organizations ${clause} ORDER BY id DESC`)
    .all(...params)
    .map(mapOrganization);
}
function createOrganization(d) {
  const info = getDb()
    .prepare(`INSERT INTO organizations (code, name, type, contact, phone, address)
              VALUES (@code, @name, @type, @contact, @phone, @address)`)
    .run({
      code: d.code, name: d.name, type: d.type,
      contact: d.contact ?? null, phone: d.phone ?? null, address: d.address ?? null,
    });
  return getOrganizationById(info.lastInsertRowid);
}
function updateOrganization(id, d) {
  const allowed = { name: 'name', type: 'type', contact: 'contact', phone: 'phone', address: 'address' };
  const sets = [];
  const params = [];
  for (const [k, col] of Object.entries(allowed)) {
    if (d[k] !== undefined) { sets.push(`${col} = ?`); params.push(d[k]); }
  }
  if (sets.length === 0) return getOrganizationById(id);
  sets.push("updated_at = datetime('now')");
  params.push(id);
  getDb().prepare(`UPDATE organizations SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getOrganizationById(id);
}
function countOrganizations() {
  return getDb().prepare('SELECT COUNT(*) AS n FROM organizations').get().n;
}

/* ----------------------------- 用户 ----------------------------- */

function getUserByUsername(username) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}
function getUserById(id) {
  return mapUser(getDb().prepare('SELECT * FROM users WHERE id = ?').get(id));
}
function listUsers({ role, userType, orgId, scope } = {}) {
  const filters = {};
  if (role) filters.role = role;
  if (userType) filters.user_type = userType;
  if (orgId !== undefined) filters.org_id = orgId;
  const { clause, params } = _buildWhere(filters, scope);
  return getDb()
    .prepare(`SELECT * FROM users ${clause} ORDER BY id ASC`)
    .all(...params)
    .map(mapUser);
}
function createUser({ username, password, name, role = 'viewer', userType = 'internal', orgId, active = true }) {
  const info = getDb()
    .prepare('INSERT INTO users (username, password_hash, name, role, user_type, org_id, active) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(username, hashPassword(password), name, role, userType, orgId ?? null, active ? 1 : 0);
  return getUserById(info.lastInsertRowid);
}
function updateUser(id, fields) {
  const sets = [];
  const params = [];
  if (fields.name !== undefined) { sets.push('name = ?'); params.push(fields.name); }
  if (fields.role !== undefined) { sets.push('role = ?'); params.push(fields.role); }
  if (fields.userType !== undefined) { sets.push('user_type = ?'); params.push(fields.userType); }
  if (fields.orgId !== undefined) { sets.push('org_id = ?'); params.push(fields.orgId ?? null); }
  if (fields.active !== undefined) { sets.push('active = ?'); params.push(fields.active ? 1 : 0); }
  if (fields.password !== undefined) { sets.push('password_hash = ?'); params.push(hashPassword(fields.password)); }
  if (sets.length === 0) return getUserById(id);
  sets.push("updated_at = datetime('now')");
  params.push(id);
  getDb().prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getUserById(id);
}
function deleteUser(id) {
  return getDb().prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
}
function countUsers() {
  return getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

/* ----------------------------- 蜂场 ----------------------------- */

function listApiaries({ district, status, keyword, scope } = {}) {
  const filters = {};
  if (district) filters.district = district;
  if (status) filters.status = status;
  const { clause, params } = _buildWhere(filters, scope);
  let sql = `SELECT * FROM apiaries ${clause}`;
  if (keyword) {
    const kwClause = clause ? 'AND' : 'WHERE';
    sql = `SELECT * FROM apiaries ${clause} ${kwClause} (code LIKE ? OR name LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  return getDb().prepare(`${sql} ORDER BY id DESC`).all(...params).map(mapApiary);
}
function getApiaryById(id) {
  return mapApiary(getDb().prepare('SELECT * FROM apiaries WHERE id = ?').get(id));
}
function getApiaryByCode(code) {
  return mapApiary(getDb().prepare('SELECT * FROM apiaries WHERE code = ?').get(code));
}
function createApiary(d) {
  const info = getDb()
    .prepare(`INSERT INTO apiaries (code, name, location, district, owner_id, org_id, status)
              VALUES (@code, @name, @location, @district, @ownerId, @orgId, @status)`)
    .run({
      code: d.code, name: d.name, location: d.location, district: d.district,
      ownerId: d.ownerId ?? null, orgId: d.orgId ?? null, status: d.status || 'active',
    });
  return getApiaryById(info.lastInsertRowid);
}
function updateApiary(id, d) {
  const allowed = { name: 'name', location: 'location', district: 'district', ownerId: 'owner_id', orgId: 'org_id', status: 'status' };
  const sets = [];
  const params = [];
  for (const [k, col] of Object.entries(allowed)) {
    if (d[k] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(d[k] === null ? null : d[k]);
    }
  }
  if (sets.length === 0) return getApiaryById(id);
  sets.push("updated_at = datetime('now')");
  params.push(id);
  getDb().prepare(`UPDATE apiaries SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getApiaryById(id);
}
function deleteApiary(id) {
  return getDb().prepare('DELETE FROM apiaries WHERE id = ?').run(id).changes > 0;
}

/* ----------------------------- 蜂箱/蜂群 ----------------------------- */

function listHives({ apiaryId, status, keyword, scope } = {}) {
  const filters = {};
  if (apiaryId !== undefined) filters.apiary_id = apiaryId;
  if (status) filters.status = status;
  const { clause, params } = _buildWhere(filters, scope);
  let sql = `SELECT * FROM hives ${clause}`;
  if (keyword) {
    const kwClause = clause ? 'AND' : 'WHERE';
    sql = `SELECT * FROM hives ${clause} ${kwClause} code LIKE ?`;
    params.push(`%${keyword}%`);
  }
  return getDb().prepare(`${sql} ORDER BY id DESC`).all(...params).map(mapHive);
}
function getHiveById(id) {
  return mapHive(getDb().prepare('SELECT * FROM hives WHERE id = ?').get(id));
}
function getHiveByCode(code) {
  return mapHive(getDb().prepare('SELECT * FROM hives WHERE code = ?').get(code));
}
function createHive(d) {
  const info = getDb()
    .prepare(`INSERT INTO hives (code, apiary_id, queen_year, frame_count, strength, status, installed_at)
              VALUES (@code, @apiaryId, @queenYear, @frameCount, @strength, @status, @installedAt)`)
    .run({
      code: d.code, apiaryId: d.apiaryId, queenYear: d.queenYear ?? null,
      frameCount: d.frameCount ?? 0, strength: d.strength || 'medium',
      status: d.status || 'active', installedAt: d.installedAt ?? null,
    });
  return getHiveById(info.lastInsertRowid);
}
function updateHive(id, d) {
  const allowed = {
    queenYear: 'queen_year', frameCount: 'frame_count', strength: 'strength',
    status: 'status', installedAt: 'installed_at',
  };
  const sets = [];
  const params = [];
  for (const [k, col] of Object.entries(allowed)) {
    if (d[k] !== undefined) { sets.push(`${col} = ?`); params.push(d[k]); }
  }
  if (sets.length === 0) return getHiveById(id);
  sets.push("updated_at = datetime('now')");
  params.push(id);
  getDb().prepare(`UPDATE hives SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getHiveById(id);
}
function deleteHive(id) {
  return getDb().prepare('DELETE FROM hives WHERE id = ?').run(id).changes > 0;
}

/* ----------------------------- 检查记录 ----------------------------- */

function listInspections({ hiveId, scope } = {}) {
  const filters = {};
  if (hiveId !== undefined) filters.hive_id = hiveId;
  const { clause, params } = _buildWhere(filters, scope);
  return getDb()
    .prepare(`SELECT * FROM inspections ${clause} ORDER BY inspect_date DESC, id DESC`)
    .all(...params)
    .map(mapInspection);
}
function getInspectionById(id) {
  return mapInspection(getDb().prepare('SELECT * FROM inspections WHERE id = ?').get(id));
}
function createInspection(d) {
  const info = getDb()
    .prepare(`INSERT INTO inspections (hive_id, inspector_id, inspect_date, has_queen, brood_frames, honey_frames, disease, note)
              VALUES (@hiveId, @inspectorId, @inspectDate, @hasQueen, @broodFrames, @honeyFrames, @disease, @note)`)
    .run({
      hiveId: d.hiveId, inspectorId: d.inspectorId ?? null, inspectDate: d.inspectDate,
      hasQueen: d.hasQueen === false ? 0 : 1, broodFrames: d.broodFrames ?? 0,
      honeyFrames: d.honeyFrames ?? 0, disease: d.disease || 'none', note: d.note ?? '',
    });
  return mapInspection(getDb().prepare('SELECT * FROM inspections WHERE id = ?').get(info.lastInsertRowid));
}

/* ----------------------------- 采收批次 ----------------------------- */

function listHarvests({ apiaryId, product, scope } = {}) {
  const filters = {};
  if (apiaryId !== undefined) filters.apiary_id = apiaryId;
  if (product) filters.product = product;
  const { clause, params } = _buildWhere(filters, scope);
  return getDb()
    .prepare(`SELECT * FROM harvests ${clause} ORDER BY harvest_date DESC, id DESC`)
    .all(...params)
    .map(mapHarvest);
}
function getHarvestById(id) {
  return mapHarvest(getDb().prepare('SELECT * FROM harvests WHERE id = ?').get(id));
}
function getHarvestByBatchNo(batchNo) {
  return mapHarvest(getDb().prepare('SELECT * FROM harvests WHERE batch_no = ?').get(batchNo));
}
function createHarvest(d) {
  const info = getDb()
    .prepare(`INSERT INTO harvests (batch_no, apiary_id, harvest_date, product, quantity_kg, internal_cost, note)
              VALUES (@batchNo, @apiaryId, @harvestDate, @product, @quantityKg, @internalCost, @note)`)
    .run({
      batchNo: d.batchNo, apiaryId: d.apiaryId, harvestDate: d.harvestDate,
      product: d.product || 'honey', quantityKg: d.quantityKg ?? 0,
      internalCost: d.internalCost ?? 0, note: d.note ?? '',
    });
  return mapHarvest(getDb().prepare('SELECT * FROM harvests WHERE id = ?').get(info.lastInsertRowid));
}
function updateHarvest(id, d) {
  const allowed = {
    harvestDate: 'harvest_date', product: 'product', quantityKg: 'quantity_kg',
    internalCost: 'internal_cost', note: 'note',
  };
  const sets = [];
  const params = [];
  for (const [k, col] of Object.entries(allowed)) {
    if (d[k] !== undefined) { sets.push(`${col} = ?`); params.push(d[k]); }
  }
  if (sets.length === 0) return getHarvestById(id);
  params.push(id);
  getDb().prepare(`UPDATE harvests SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getHarvestById(id);
}

/* ----------------------------- 采收授权 ----------------------------- */

function listHarvestAuths({ harvestId, buyerOrgId, scope } = {}) {
  const filters = {};
  if (harvestId !== undefined) filters.harvest_id = harvestId;
  if (buyerOrgId !== undefined) filters.buyer_org_id = buyerOrgId;
  const { clause, params } = _buildWhere(filters, scope);
  return getDb()
    .prepare(`SELECT * FROM harvest_authorizations ${clause} ORDER BY id DESC`)
    .all(...params)
    .map(mapHarvestAuth);
}
function getHarvestAuthById(id) {
  return mapHarvestAuth(getDb().prepare('SELECT * FROM harvest_authorizations WHERE id = ?').get(id));
}
function createHarvestAuth(d) {
  const info = getDb()
    .prepare(`INSERT INTO harvest_authorizations (harvest_id, buyer_org_id, authorized_by)
              VALUES (@harvestId, @buyerOrgId, @authorizedBy)`)
    .run({
      harvestId: d.harvestId, buyerOrgId: d.buyerOrgId,
      authorizedBy: d.authorizedBy ?? null,
    });
  return getHarvestAuthById(info.lastInsertRowid);
}
function deleteHarvestAuth(id) {
  return getDb().prepare('DELETE FROM harvest_authorizations WHERE id = ?').run(id).changes > 0;
}
function getHarvestAuth(harvestId, buyerOrgId) {
  return mapHarvestAuth(
    getDb()
      .prepare('SELECT * FROM harvest_authorizations WHERE harvest_id = ? AND buyer_org_id = ?')
      .get(harvestId, buyerOrgId)
  );
}

module.exports = {
  mapOrganization, mapUser, mapApiary, mapHive, mapInspection, mapHarvest, mapHarvestAuth,
  getOrganizationById, getOrganizationByCode, listOrganizations, createOrganization, updateOrganization, countOrganizations,
  getUserByUsername, getUserById, listUsers, createUser, updateUser, deleteUser, countUsers,
  listApiaries, getApiaryById, getApiaryByCode, createApiary, updateApiary, deleteApiary,
  listHives, getHiveById, getHiveByCode, createHive, updateHive, deleteHive,
  listInspections, getInspectionById, createInspection,
  listHarvests, getHarvestById, getHarvestByBatchNo, createHarvest, updateHarvest,
  listHarvestAuths, getHarvestAuthById, createHarvestAuth, deleteHarvestAuth, getHarvestAuth,
};
