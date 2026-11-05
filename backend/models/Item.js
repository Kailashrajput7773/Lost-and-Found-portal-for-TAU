const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const os = require('os');
const isVercel = !!process.env.VERCEL;
const SEED_FILE = path.join(__dirname, '..', 'data', 'items.json');
const DATA_FILE = isVercel
  ? path.join(os.tmpdir(), 'items.json')
  : SEED_FILE;

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, required: false, default: "" },
  contact: { type: String, required: true },
  category: { type: String, required: true },
  desc: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  img: { type: String, default: "" },
  approved: { type: Boolean, default: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  question: { type: String, default: "" },
  custodyHandedOver: { type: Boolean, default: false },
  custodyLocation: { type: String, default: "" },
  custodyReceiptNo: { type: String, default: "" },
  claimedBy: { type: String, default: "" },
  claimSubmissions: { type: Array, default: [] },
  handover: {
    verified: { type: Boolean, default: false },
    handoverCode: { type: String, default: "" },
    handoverOtpExpires: { type: Date },
    recipientName: { type: String, default: "" },
    recipientRoll: { type: String, default: "" },
    recipientContact: { type: String, default: "" },
    handedOverBy: { type: String, default: "" },
    handoverLocation: { type: String, default: "" },
    handedOverAt: { type: Date },
    receiptNumber: { type: String, default: "" },
    notes: { type: String, default: "" },
    rating: { type: Number, default: 5 },
    feedback: { type: String, default: "" }
  },
  createdAt: { type: Date, default: Date.now }
});

const MongoItem = mongoose.model('Item', itemSchema);

function readLocalItems() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      let seedData = '[]';
      if (fs.existsSync(SEED_FILE)) {
        try {
          seedData = fs.readFileSync(SEED_FILE, 'utf8') || '[]';
        } catch (readErr) {
          console.warn("Notice: could not read SEED_FILE:", readErr.message);
        }
      }
      fs.writeFileSync(DATA_FILE, seedData, 'utf8');
      return JSON.parse(seedData || '[]');
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
    this.approved = typeof data.approved === 'boolean' ? data.approved : true;
    this.type = data.type || "lost";
    this.status = data.status || "active";
    this.question = data.question || "";
    this.custodyHandedOver = Boolean(data.custodyHandedOver);
    this.custodyLocation = data.custodyLocation || "";
    this.custodyReceiptNo = data.custodyReceiptNo || "";
    this.claimedBy = data.claimedBy || "";
    this.claimSubmissions = Array.isArray(data.claimSubmissions) ? data.claimSubmissions : [];
    this.handover = data.handover || {
      verified: false,
      handoverCode: "",
      handoverOtpExpires: null,
      recipientName: "",
      recipientRoll: "",
      recipientContact: "",
      handedOverBy: "",
      handoverLocation: "",
      handedOverAt: null,
      receiptNumber: "",
      notes: "",
      rating: 5,
      feedback: ""
    };
    this.createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();
  }

  async save() {
    if (mongoose.connection.readyState === 1) {
      const doc = new MongoItem(this);
      return doc.save();
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
    if (query && Object.keys(query).length > 0) {
      items = items.filter(item => {
        for (const [key, val] of Object.entries(query)) {
          if (val === undefined || val === null || val === 'all') continue;
          if (key === '$or' && Array.isArray(val)) {
            const matchesAny = val.some(cond => {
              return Object.entries(cond).some(([cKey, cVal]) => {
                const itemVal = String(item[cKey] || "");
                if (cVal instanceof RegExp) return cVal.test(itemVal);
                return itemVal.toLowerCase().includes(String(cVal).toLowerCase());
              });
            });
            if (!matchesAny) return false;
            continue;
          }
          if (typeof val === 'boolean') {
            if (Boolean(item[key]) !== val) return false;
            continue;
          }
          if (val instanceof RegExp) {
            if (!val.test(String(item[key] || ""))) return false;
            continue;
          }
          if (key === '_id' || key === 'id') {
            if (String(item._id || item.id) !== String(val)) return false;
            continue;
          }
          if (String(item[key] || "") !== String(val)) {
            return false;
          }
        }
        return true;
      });
    }

    const result = items.map(item => ({
      ...item,
      status: item.status || 'active',
      question: item.question || '',
      custodyHandedOver: Boolean(item.custodyHandedOver),
      custodyLocation: item.custodyLocation || '',
      custodyReceiptNo: item.custodyReceiptNo || '',
      claimedBy: item.claimedBy || '',
      claimSubmissions: item.claimSubmissions || [],
      handover: item.handover || { verified: false },
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

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await MongoItem.findById(id);
        if (doc) return doc;
      } catch (e) {}
    }
    const items = readLocalItems();
    const item = items.find(it => String(it._id || it.id) === String(id));
    if (!item) return null;
    return new ItemWrapper(item);
  }

  static async countDocuments(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoItem.countDocuments(query);
    }
    const list = await this.find(query);
    return list.length;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (mongoose.connection.readyState === 1) {
      try {
        const cleanOpts = { returnDocument: 'after', ...options }; delete cleanOpts.new; const doc = await MongoItem.findByIdAndUpdate(id, update, cleanOpts);
        if (doc) return doc;
      } catch (e) {}
    }
    const items = readLocalItems();
    const index = items.findIndex(it => String(it._id || it.id) === String(id));
    if (index === -1) return null;
    const fieldsToUpdate = update.$set ? { ...update.$set } : { ...update };
    delete fieldsToUpdate.$set;
    items[index] = { ...items[index], ...fieldsToUpdate };
    writeLocalItems(items);
    const updated = items[index];
    return { ...updated, _id: updated._id || updated.id, id: updated._id || updated.id };
  }

  static async findByIdAndDelete(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await MongoItem.findByIdAndDelete(id);
        if (doc) return doc;
      } catch (e) {}
    }
    const items = readLocalItems();
    const index = items.findIndex(it => String(it._id || it.id) === String(id));
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    writeLocalItems(items);
    return { ...deleted, _id: deleted._id || deleted.id, id: deleted._id || deleted.id };
  }
}

module.exports = ItemWrapper;
