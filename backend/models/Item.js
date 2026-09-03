const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const DATA_FILE = path.join(__dirname, '..', 'data', 'items.json');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, required: false, default: "" },
  contact: { type: String, required: true },
  category: { type: String, required: true },
  desc: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  img: { type: String, default: "" },
  approved: { type: Boolean, default: false },
  type: { type: String, enum: ['lost', 'found'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongoItem = mongoose.model('Item', itemSchema);

function readLocalItems() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Error reading local items.json:', e.message);
    return [];
  }
}

function writeLocalItems(items) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local items.json:', e.message);
  }
}

class ItemWrapper {
  constructor(data = {}) {
    if (mongoose.connection.readyState === 1) {
      return new MongoItem(data);
    }
    this._id = data._id || data.id || crypto.randomUUID();
    this.id = this._id;
    this.name = data.name || "";
    this.roll = data.roll || "";
    this.contact = data.contact || "";
    this.category = data.category || "";
    this.desc = data.desc || "";
    this.location = data.location || "";
    this.date = data.date || "";
    this.img = data.img || "";
    this.approved = typeof data.approved === 'boolean' ? data.approved : false;
    this.type = data.type || "lost";
    this.createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();
  }

  async save() {
    if (mongoose.connection.readyState === 1) {
      return this.save();
    }
    const items = readLocalItems();
    const existingIndex = items.findIndex(it => (it._id || it.id) === this._id);
    if (existingIndex >= 0) {
      items[existingIndex] = { ...this };
    } else {
      items.push({ ...this });
    }
    writeLocalItems(items);
    return this;
  }

  static find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoItem.find(query);
    }
    let items = readLocalItems();
    if (query) {
      items = items.filter(item => {
        if (typeof query.approved === 'boolean' && item.approved !== query.approved) return false;
        if (query.type && item.type !== query.type) return false;
        if (query.category && item.category !== query.category) return false;
        if (query.location && item.location !== query.location) return false;
        if (query.date && item.date !== query.date) return false;
        if (Array.isArray(query.$or)) {
          const matchesAny = query.$or.some(cond => {
            return Object.entries(cond).some(([key, val]) => {
              const itemVal = String(item[key] || "");
              if (val instanceof RegExp) return val.test(itemVal);
              return itemVal.toLowerCase().includes(String(val).toLowerCase());
            });
          });
          if (!matchesAny) return false;
        }
        return true;
      });
    }

    const result = items.map(item => ({
      ...item,
      _id: item._id || item.id,
      id: item._id || item.id
    }));

    return {
      sort(sortOpt) {
        if (sortOpt && sortOpt.createdAt === -1) {
          result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return Promise.resolve(result);
      },
      then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
      }
    };
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoItem.findByIdAndUpdate(id, update, options);
    }
    const items = readLocalItems();
    const index = items.findIndex(it => (it._id || it.id) === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...update };
    writeLocalItems(items);
    const updated = items[index];
    return { ...updated, _id: updated._id || updated.id, id: updated._id || updated.id };
  }

  static async findByIdAndDelete(id) {
    if (mongoose.connection.readyState === 1) {
      return MongoItem.findByIdAndDelete(id);
    }
    const items = readLocalItems();
    const index = items.findIndex(it => (it._id || it.id) === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    writeLocalItems(items);
    return { ...deleted, _id: deleted._id || deleted.id, id: deleted._id || deleted.id };
  }
}

module.exports = ItemWrapper;
