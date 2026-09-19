const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const DATA_FILE = path.join(__dirname, '..', 'data', 'allegations.json');

const allegationSchema = new mongoose.Schema({
  reportedUserId: { type: String, default: "" },
  reportedUserName: { type: String, default: "" },
  reportedUserEmail: { type: String, default: "" },
  reportedByEmail: { type: String, default: "" },
  reportedByName: { type: String, default: "" },
  reason: { type: String, required: true },
  details: { type: String, default: "" },
  itemId: { type: String, default: "" },
  itemName: { type: String, default: "" },
  status: { type: String, enum: ['pending', 'reviewed', 'action_taken'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const MongoAllegation = mongoose.model('Allegation', allegationSchema);

function readLocalAllegations() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Error reading local allegations.json:', e.message);
    return [];
  }
}

function writeLocalAllegations(items) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local allegations.json:', e.message);
  }
}

class AllegationWrapper {
  constructor(data = {}) {
    if (mongoose.connection.readyState === 1) {
      return new MongoAllegation(data);
    }
    this._id = data._id || data.id || crypto.randomUUID();
    this.id = this._id;
    this.reportedUserId = data.reportedUserId || "";
    this.reportedUserName = data.reportedUserName || "";
    this.reportedUserEmail = data.reportedUserEmail || "";
    this.reportedByEmail = data.reportedByEmail || "";
    this.reportedByName = data.reportedByName || "";
    this.reason = data.reason || "";
    this.details = data.details || "";
    this.itemId = data.itemId || "";
    this.itemName = data.itemName || "";
    this.status = data.status || "pending";
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  async save() {
    if (mongoose.connection.readyState === 1) {
      return this.save();
    }
    const items = readLocalAllegations();
    items.push({ ...this });
    writeLocalAllegations(items);
    return this;
  }

  static find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoAllegation.find(query);
    }
    let items = readLocalAllegations();
    if (query && query.status) {
      items = items.filter(it => it.status === query.status);
    }
    const result = items.map(it => ({ ...it, _id: it._id || it.id, id: it._id || it.id }));
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
      return MongoAllegation.findByIdAndUpdate(id, update, options);
    }
    const items = readLocalAllegations();
    const index = items.findIndex(it => (it._id || it.id) === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...update };
    writeLocalAllegations(items);
    const updated = items[index];
    return { ...updated, _id: updated._id || updated.id, id: updated._id || updated.id };
  }

  static async findByIdAndDelete(id) {
    if (mongoose.connection.readyState === 1) {
      return MongoAllegation.findByIdAndDelete(id);
    }
    const items = readLocalAllegations();
    const index = items.findIndex(it => (it._id || it.id) === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    writeLocalAllegations(items);
    return { ...deleted, _id: deleted._id || deleted.id, id: deleted._id || deleted.id };
  }
}

module.exports = AllegationWrapper;
