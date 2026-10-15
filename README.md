# 🏛️ The Apollo University - Lost & Found Portal Hub

A full-stack, responsive web application for **The Apollo University** campus community to help students and faculty report, manage, match, and reunite lost or found belongings efficiently and securely.

---

## ✨ Key Features

1. **🤖 Automated "Smart Matching" & Scoring**:
   - Compares lost and found listings in real time using category matching, location proximity, and keyword extraction.
   - Calculates a percentage match score (e.g. 100% Match) with transparent matching reasons.
2. **🛡️ Campus SafeTag™ QR Generator**:
   - Students can generate and print personal QR code stickers for laptops, ID cards, keys, water bottles, and backpacks.
   - When scanned anywhere on campus, it opens verified return instructions without exposing private phone numbers.
3. **🔒 Anti-Fraud Ownership Verification Challenge**:
   - Finders can attach a secret question (e.g. *"What is the sticker on the back?"*).
   - Claimants must submit their answer to verify ownership before contact info is finalized.
4. **📲 1-Click WhatsApp Campus Broadcast**:
   - Instant sharing of lost or found cards directly into Apollo University WhatsApp student groups.
5. **🎉 "Hall of Reunited" & Confetti Celebration**:
   - Items can be marked as "Reunited with Owner 🎉" which triggers celebratory confetti and logs successful campus returns.
6. **📍 Campus Hotspot Dropdowns**:
   - Pre-configured TAU locations (Central Library, Academic Blocks A/B/C, Cafeteria, Hostels, Auditorium, Sports Arena).
7. **📸 Client-Side Photo Preview & Mobile Camera**:
   - Supports capturing images directly from smartphone cameras (`capture="environment"`) with live previews and removal.
8. **🛡️ Role-Based Authentication & Moderation Console**:
   - 2FA OTP verification for administrators, user suspension, allegation filing, and live analytics.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, React Router 7, Lucide Icons, Canvas Confetti, QRCode, Vanilla CSS Design System.
- **Backend**: Node.js, Express, Multer, Nodemailer, Cloudinary (optional cloud media storage).
- **Database**: Dual-engine architecture:
  - **Production**: MongoDB / MongoDB Atlas (Mongoose)
  - **Local/Offline**: Persistent JSON storage (`backend/data/items.json`)

---

## 🚀 Running Locally

```bash
# 1. Clone repository
git clone https://github.com/Kailashrajput7773/Lost-and-Found-portal-for-TAU.git
cd Lost-and-Found-portal-for-TAU

# 2. Run both Backend & Frontend concurrently
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🌐 Production Deployment Guide

### Architecture

```text
[ Frontend: Vercel ]  ──(HTTPS)──►  [ Backend: Render ]  ──►  [ Database: MongoDB Atlas ]
                                           │
                                           └──► [ Cloud Storage: Cloudinary ]
```

### 1. Database (MongoDB Atlas — Free)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free **M0 Sandbox** cluster.
2. In **Network Access**, whitelist `0.0.0.0/0` (Allow from anywhere).
3. In **Database Access**, create a user and copy the connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lostandfound?retryWrites=true&w=majority
   ```

### 2. Backend (Render.com — Free)
1. Sign in to [render.com](https://render.com) and click **New + ➔ Web Service**.
2. Connect this GitHub repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables:
   - `PORT`: `5000`
   - `MONGO_URI`: `your-mongodb-atlas-uri`
   - `ADMIN_KEY`: `your-secure-admin-key`
   - `FRONTEND_URL`: `https://your-app.vercel.app`
   - `EMAIL_USER`: `your-gmail@gmail.com`
   - `EMAIL_PASS`: `your-gmail-app-password`
   - *(Optional Cloudinary)*: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
5. Deploy to get your live URL (e.g. `https://tau-backend.onrender.com`).

### 3. Frontend (Vercel — Free)
1. Sign in to [vercel.com](https://vercel.com) and click **Add New ➔ Project**.
2. Select your repository.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://tau-backend.onrender.com`
5. Click **Deploy**! React Router navigation is handled automatically by `frontend/vercel.json`.
