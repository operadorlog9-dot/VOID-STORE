const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const purchasesFile = path.join(dataDir, 'purchases.json');

function ensureData() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(purchasesFile)) fs.writeFileSync(purchasesFile, '[]', 'utf8');
}

function readPurchases() {
  ensureData();
  try {
    return JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
  } catch {
    return [];
  }
}

function addPurchase(record) {
  const list = readPurchases();
  list.push(record);
  fs.writeFileSync(purchasesFile, JSON.stringify(list, null, 2), 'utf8');
}

function hasConfirmedPurchase(userId) {
  return readPurchases().some((p) => p.userId === userId && p.status === 'confirmed');
}

module.exports = { readPurchases, addPurchase, hasConfirmedPurchase };
