const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roll: { type: String, default: "" },
  phone: { type: String, default: "" },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: "" },
  lastActive: { type: Date, default: Date.now },
  reportsReceived: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', userSchema);

function readLocalUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Error reading local users.json:', e.message);
    return [];
  }
}

function writeLocalUsers(users) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local users.json:', e.message);
  }
}

class UserWrapper {
  constructor(data = {}) {
    if (mongoose.connection.readyState === 1) {
      return new MongoUser(data);
    }
    this._id = data._id || data.id || crypto.randomUUID();
    this.id = this._id;
    this.name = data.name || data.fullName || "";
    this.email = (data.email || "").toLowerCase().trim();
    this.roll = data.roll || "";
    this.phone = data.phone || "";
    this.password = data.password || "";
    this.role = data.role || "student";
    this.isBanned = typeof data.isBanned === 'boolean' ? data.isBanned : false;
    this.banReason = data.banReason || "";
    this.lastActive = data.lastActive ? new Date(data.lastActive) : new Date();
    this.reportsReceived = Number(data.reportsReceived || 0);
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  async save() {
    if (mongoose.connection.readyState === 1) {
      return this.save();
    }
    const users = readLocalUsers();
    const existingIndex = users.findIndex(u => (u._id || u.id) === this._id || (u.email && u.email.toLowerCase() === this.email.toLowerCase()));
    if (existingIndex >= 0) {
      users[existingIndex] = { ...this };
    } else {
      users.push({ ...this });
    }
    writeLocalUsers(users);
    return this;
  }

  static async findOne(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoUser.findOne(query);
    }
    const users = readLocalUsers();
    const match = users.find(u => {
      if (query.email && u.email.toLowerCase() !== String(query.email).toLowerCase()) return false;
      if (query.roll && u.roll.toLowerCase() !== String(query.roll).toLowerCase()) return false;
      if (query._id && (u._id || u.id) !== query._id) return false;
      if (typeof query.isBanned === 'boolean' && u.isBanned !== query.isBanned) return false;
      if (Array.isArray(query.$or)) {
        const matchesAny = query.$or.some(cond => {
          return Object.entries(cond).some(([key, val]) => {
            const userVal = String(u[key] || "");
            return userVal.toLowerCase() === String(val).toLowerCase();
          });
        });
        if (!matchesAny) return false;
      }
      return true;
    });
    return match ? { ...match, _id: match._id || match.id, id: match._id || match.id } : null;
  }

  static async findById(id) {
    return this.findOne({ _id: id });
  }

  static find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoUser.find(query);
    }
    let users = readLocalUsers();
    if (query) {
      users = users.filter(u => {
        if (typeof query.isBanned === 'boolean' && u.isBanned !== query.isBanned) return false;
        if (query.role && u.role !== query.role) return false;
        return true;
      });
    }
    const result = users.map(u => ({ ...u, _id: u._id || u.id, id: u._id || u.id }));
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
      return MongoUser.findByIdAndUpdate(id, update, options);
    }
    const users = readLocalUsers();
    const index = users.findIndex(u => (u._id || u.id) === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...update };
    writeLocalUsers(users);
    const updated = users[index];
    return { ...updated, _id: updated._id || updated.id, id: updated._id || updated.id };
  }

  static async countDocuments(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoUser.countDocuments(query);
    }
    const users = readLocalUsers();
    return users.length;
  }
}

module.exports = UserWrapper;
