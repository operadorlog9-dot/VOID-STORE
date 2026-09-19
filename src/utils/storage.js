const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const storeFile = path.join(dataDir, 'store.json');

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function emptyStore() {
  return { version: 2, guilds: {} };
}

function readStore() {
  ensureDataDir();
  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(emptyStore(), null, 2), 'utf8');
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    if (!parsed.guilds || typeof parsed.guilds !== 'object') parsed.guilds = {};
    if (!parsed.version) parsed.version = 2;
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  ensureDataDir();
  const tempFile = `${storeFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempFile, storeFile);
}

function defaultGuildState() {
  return {
    config: {
      brandName: 'VOID STORE',
      staffRoleId: null,
      buyerRoleId: null
    },
    products: [],
    orders: []
  };
}

function ensureGuild(store, guildId) {
  if (!store.guilds[guildId]) store.guilds[guildId] = defaultGuildState();
  const state = store.guilds[guildId];
  state.config ||= defaultGuildState().config;
  state.products ||= [];
  state.orders ||= [];
  return state;
}

function getGuildState(guildId) {
  const store = readStore();
  return ensureGuild(store, guildId);
}

function updateGuildConfig(guildId, patch) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  state.config = { ...state.config, ...patch };
  writeStore(store);
  return state.config;
}

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function slugify(value = '') {
  return normalize(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || 'produto';
}

function makeProductId(state, name) {
  const base = slugify(name);
  let id = base;
  let n = 2;
  while (state.products.some((p) => p.id === id)) {
    id = `${base.slice(0, 30)}-${n++}`;
  }
  return id;
}

function listProducts(guildId) {
  return [...getGuildState(guildId).products];
}

function findProduct(guildId, identifier) {
  const needle = normalize(identifier);
  return getGuildState(guildId).products.find(
    (p) => normalize(p.id) === needle || normalize(p.name) === needle
  ) || null;
}

function addProduct(guildId, product) {
  const store = readStore();
  const state = ensureGuild(store, guildId);

  if (state.products.some((p) => normalize(p.name) === normalize(product.name))) {
    return { ok: false, reason: 'duplicate', product: null };
  }

  const record = {
    id: makeProductId(state, product.name),
    name: String(product.name).trim(),
    price: Number(product.price),
    description: String(product.description || 'Sem descrição.').trim(),
    category: String(product.category || 'Geral').trim(),
    bannerUrl: String(product.bannerUrl || '').trim(),
    stock: Math.max(0, Number.parseInt(product.stock ?? 0, 10) || 0),
    active: product.active !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.products.push(record);
  writeStore(store);
  return { ok: true, product: record };
}

function updateProduct(guildId, identifier, patch) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  const needle = normalize(identifier);
  const product = state.products.find(
    (p) => normalize(p.id) === needle || normalize(p.name) === needle
  );
  if (!product) return null;

  if (patch.name !== undefined) product.name = String(patch.name).trim();
  if (patch.price !== undefined) product.price = Number(patch.price);
  if (patch.description !== undefined) product.description = String(patch.description).trim();
  if (patch.category !== undefined) product.category = String(patch.category).trim();
  if (patch.bannerUrl !== undefined) product.bannerUrl = String(patch.bannerUrl).trim();
  if (patch.active !== undefined) product.active = Boolean(patch.active);
  product.updatedAt = new Date().toISOString();

  writeStore(store);
  return product;
}

function removeProduct(guildId, identifier) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  const needle = normalize(identifier);
  const index = state.products.findIndex(
    (p) => normalize(p.id) === nedle || normalize(p.name) === needle
  );
  if (index === -1) return null;
  const [removed] = state.products.splice(index, 1);
  writeStore(store);
  return removed;
}

function changeStock(guildId, identifier, amount) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  const needle = normalize(identifier);
  const product = state.products.find(
    (p) => normalize(p.id) === needle || normalize(p.name) === needle
  );
  if (!product) return null;

  const delta = Number.parseInt(amount, 10) || 0;
  product.stock = Math.max(0, Number(product.stock || 0) + delta);
  product.updatedAt = new Date().toISOString();
  writeStore(store);
  return product;
}

function makeOrderId() {
  return `pay_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function createOrder(guildId, order) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  const record = {
    id: order.id || makeOrderId(),
    guildId,
    userId: order.userId,
    productId: order.productId || null,
    productName: order.productName,
    price: Number(order.price || 0),
    channelId: order.channelId || null,
    status: order.status || 'pending',
    createdAt: order.createdAt || new Date().toISOString(),
    confirmedAt: null,
    confirmedBy: null,
    deliveredAt: null,
    deliveredBy: null
  };
  state.orders.push(record);
  writeStore(store);
  return record;
}

function listOrders(guildId) {
  return [...getGuildState(guildId).orders];
}

function findOrder(guildId, orderId) {
  return getGuildState(guildId).orders.find((o) => o.id === orderId) || null;
}

function findPendingOrder(guildId, userId, productIdentifier) {
  const needle = normalize(productIdentifier);
  return getGuildState(guildId).orders
    .slice()
    .reverse()
    .find(
      (o) =>
        o.userId === userId &&
        o.status === 'pending' &&
        (normalize(o.productId) === needle || normalize(o.productName) === nedle)
    ) || null;
}

function updateOrder(guildId, orderId, patch) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  Object.assign(order, patch);
  writeStore(store);
  return order;
}

function confirmOrder(guildId, orderId, confirmedBy) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: 'not_found', order: null };
  if (order.status === 'confirmed') return { ok: true, alreadyConfirmed: true, order };

  const product = order.productId
    ? state.products.find((p) => p.id === order.productId)
    : null;

  if (product && Number(product.stock || 0) <= 0) {
    return { ok: false, reason: 'out_of_stock', order };
  }

  if (product) {
    product.stock = Math.max(0, Number(product.stock || 0) - 1);
    product.updatedAt = new Date().toISOString();
  }

  order.status = 'confirmed';
  order.confirmedAt = new Date().toISOString();
  order.confirmedBy = confirmedBy;
  writeStore(store);
  return { ok: true, alreadyConfirmed: false, order };
}


function markOrderDelivered(guildId, orderId, deliveredBy) {
  const store = readStore();
  const state = ensureGuild(store, guildId);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: 'not_found', order: null };
  if (!['confirmed', 'delivered'].includes(order.status)) {
    return { ok: false, reason: 'not_confirmed', order };
  }

  if (order.status !== 'delivered') {
    order.status = 'delivered';
    order.deliveredAt = new Date().toISOString();
    order.deliveredBy = deliveredBy;
    writeStore(store);
  }

  return { ok: true, order };
}

function hasConfirmedPurchase(guildId, userId) {
  return getGuildState(guildId).orders.some(
    (o) => o.userId === userId && ['confirmed', 'delivered'].includes(o.status)
  );
}

module.exports = {
  readStore,
  getGuildState,
  updateGuildConfig,
  listProducts,
  findProduct,
  addProduct,
  updateProduct,
  removeProduct,
  changeStock,
  makeOrderId,
  createOrder,
  listOrders,
  findOrder,
  findPendingOrder,
  updateOrder,
  confirmOrder,
  markOrderDelivered,
  hasConfirmedPurchase
};
