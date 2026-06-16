'use strict';

const store = require('./data/store');
const { ORG_TYPES } = require('./permissions');

/**
 * 写入初始种子数据：
 * - 合作社组织 + 管理员
 * - 多个蜂农（各管自己的蜂场）
 * - 收购方组织 + 收购员
 * - 蜂场归属、蜂箱、检查记录、采收批次
 * - 采收批次流转授权给收购方
 * 幂等：若库中已存在用户则跳过，避免重复播种。
 */
function seed() {
  if (store.countUsers() > 0) {
    return { skipped: true };
  }

  const coop = store.createOrganization({
    code: 'ORG-COOP-001',
    name: '川北中蜂养殖专业合作社',
    type: ORG_TYPES.COOP,
    contact: '张理事长',
    phone: '13800138000',
    address: '四川省绵阳市平武县',
  });

  const buyer = store.createOrganization({
    code: 'ORG-BUYER-001',
    name: '成都蜜源堂药业有限公司',
    type: ORG_TYPES.BUYER,
    contact: '李采购',
    phone: '13900139000',
    address: '成都市高新区',
  });

  const admin = store.createUser({
    username: 'admin',
    password: 'admin123',
    name: '合作社管理员',
    role: 'admin',
    userType: 'internal',
    orgId: coop.id,
  });

  const beekeeper1 = store.createUser({
    username: 'beekeeper1',
    password: 'bee123',
    name: '王养蜂',
    role: 'operator',
    userType: 'internal',
    orgId: coop.id,
  });

  const beekeeper2 = store.createUser({
    username: 'beekeeper2',
    password: 'bee456',
    name: '赵蜂农',
    role: 'operator',
    userType: 'internal',
    orgId: coop.id,
  });

  const beekeeper3 = store.createUser({
    username: 'beekeeper3',
    password: 'bee789',
    name: '孙大姐',
    role: 'operator',
    userType: 'internal',
    orgId: coop.id,
  });

  const viewer = store.createUser({
    username: 'viewer',
    password: 'viewer123',
    name: '李观察',
    role: 'viewer',
    userType: 'internal',
    orgId: coop.id,
  });

  const buyerUser = store.createUser({
    username: 'buyer1',
    password: 'buyer123',
    name: '陈采购',
    role: 'viewer',
    userType: 'external',
    orgId: buyer.id,
  });

  const a1 = store.createApiary({
    code: 'FC-ABA-001',
    name: '阿坝高山中蜂场',
    location: '阿坝州黑水县色尔古寨',
    district: '阿坝州',
    ownerId: beekeeper1.id,
    orgId: coop.id,
    status: 'active',
  });

  const a2 = store.createApiary({
    code: 'FC-YA-002',
    name: '雅安林下中蜂场',
    location: '雅安市宝兴县蜂桶寨',
    district: '雅安市',
    ownerId: beekeeper2.id,
    orgId: coop.id,
    status: 'active',
  });

  const a3 = store.createApiary({
    code: 'FC-LS-003',
    name: '凉山转场越冬点',
    location: '凉山州西昌邛海边',
    district: '凉山州',
    ownerId: beekeeper3.id,
    orgId: coop.id,
    status: 'dormant',
  });

  const hives = [
    { code: 'XF-001', apiaryId: a1.id, queenYear: 2025, frameCount: 6, strength: 'strong', status: 'active', installedAt: '2025-04-10' },
    { code: 'XF-002', apiaryId: a1.id, queenYear: 2024, frameCount: 4, strength: 'medium', status: 'active', installedAt: '2024-05-01' },
    { code: 'XF-003', apiaryId: a1.id, queenYear: 2025, frameCount: 2, strength: 'weak', status: 'queenless', installedAt: '2025-06-20' },
    { code: 'YA-001', apiaryId: a2.id, queenYear: 2025, frameCount: 7, strength: 'strong', status: 'active', installedAt: '2025-03-15' },
    { code: 'YA-002', apiaryId: a2.id, queenYear: 2024, frameCount: 5, strength: 'medium', status: 'active', installedAt: '2024-04-22' },
    { code: 'LS-001', apiaryId: a3.id, queenYear: 2023, frameCount: 3, strength: 'medium', status: 'active', installedAt: '2023-09-10' },
  ];
  const hiveRecs = hives.map((h) => store.createHive(h));

  store.createInspection({
    hiveId: hiveRecs[0].id, inspectorId: beekeeper1.id, inspectDate: '2026-05-18',
    hasQueen: true, broodFrames: 3.5, honeyFrames: 2, disease: 'none', note: '群势旺，已加继箱',
  });
  store.createInspection({
    hiveId: hiveRecs[2].id, inspectorId: beekeeper1.id, inspectDate: '2026-05-18',
    hasQueen: false, broodFrames: 0, honeyFrames: 1, disease: 'none', note: '失王，需诱入新王或合并',
  });
  store.createInspection({
    hiveId: hiveRecs[3].id, inspectorId: beekeeper2.id, inspectDate: '2026-05-20',
    hasQueen: true, broodFrames: 4, honeyFrames: 3, disease: 'varroa', note: '发现少量蜂螨，已挂螨扑',
  });

  const h1 = store.createHarvest({
    batchNo: 'HV-2026-0001',
    apiaryId: a1.id,
    harvestDate: '2026-05-25',
    product: 'honey',
    quantityKg: 28.5,
    internalCost: 85.5,
    note: '高山百花蜜，波美度合格',
  });
  const h2 = store.createHarvest({
    batchNo: 'HV-2026-0002',
    apiaryId: a2.id,
    harvestDate: '2026-05-28',
    product: 'royal_jelly',
    quantityKg: 1.2,
    internalCost: 1200,
    note: '蜂王浆，冷链暂存',
  });
  const h3 = store.createHarvest({
    batchNo: 'HV-2026-0003',
    apiaryId: a3.id,
    harvestDate: '2026-06-10',
    product: 'honey',
    quantityKg: 15.0,
    internalCost: 90.0,
    note: '凉山山花蜜',
  });

  store.createHarvestAuth({
    harvestId: h1.id,
    buyerOrgId: buyer.id,
    authorizedBy: admin.id,
  });

  store.createHarvestAuth({
    harvestId: h2.id,
    buyerOrgId: buyer.id,
    authorizedBy: admin.id,
  });

  return {
    skipped: false,
    organizations: 2,
    users: 7,
    users: {
      admin: admin.id,
      beekeepers: [beekeeper1.id, beekeeper2.id, beekeeper3.id],
      buyer: buyerUser.id,
    },
    apiaries: 3,
    hives: hiveRecs.length,
    inspections: 3,
    harvests: 3,
    harvestAuthorizations: 2,
  };
}

if (require.main === module) {
  const { getDb, close } = require('./db');
  getDb();
  const result = seed();
  // eslint-disable-next-line no-console
  console.log('种子数据写入结果:', JSON.stringify(result, null, 2));
  close();
}

module.exports = { seed };
