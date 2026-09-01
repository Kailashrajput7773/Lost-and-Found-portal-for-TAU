# 🏛️ The Apollo University - Lost & Found Portal

A modern, responsive web application designed for **The Apollo University** campus community to help students and staff report, manage, and reunite lost or found items efficiently.

![The Apollo University Logo](apollo-logo.svg)

---

## ✨ Features

- **🔍 Browse & Search**: Filter lost belongings by description, category (Book, Wallet, Phone, ID Card, Electronics, Other), location zone, and date.
- **📝 Report Lost & Found Items**: Easy multi-field reporting forms supporting student details, last seen location, date, description, and photo uploads.
- **🛡️ Admin Moderation Panel**: Moderate submissions before they go live on the public listings board to ensure campus safety and prevent spam.
- **🌙 Dark & Light Mode**: Toggle seamlessly between clean light theme and sleek dark mode with automatic user preference persistence.
- **💎 Glassmorphism UI**: Built with modern CSS design tokens, smooth card hover elevation, responsive grids, and clean typography.
- **⚡ Dynamic Impact Stats**: Live counters displaying total reported items, return rate, categories, and campus coverage.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design Tokens, Glassmorphism, Responsive Grid), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **File Uploads**: Multer (Local storage in `/uploads`)
- **Data Persistence**: JSON Storage in `/data`

---

## 📁 Project Structure

```text
lost-and-found-tau-main/
├── admin.html           # Admin moderation dashboard page
├── apollo-logo.svg      # Official vector brand logo
├── app.js               # Standalone client logic & seed helper
├── client.js            # Frontend API client & UI interactions
├── data/                # Data storage directory (JSON)
│   ├── found.json
│   └── lost.json
├── index.html           # Portal landing page with hero & statistics
├── listings.html        # Public listings search & filter page
├── package.json         # Node.js project manifest & scripts
├── report-found.html    # Form to report a found item
├── report-lost.html     # Form to report a lost item
├── server.js            # Express REST API backend server
├── styles.css           # Core styling system (Light/Dark themes)
├── uploads/             # Directory for uploaded item images
└── README.md            # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- `npm` (comes with Node.js)

### Installation

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/your-username/lost-and-found-tau-main.git
   cd lost-and-found-tau-main
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm start
   ```

4. **Access the Portal**:
   Open your browser and navigate to:
   ```text
   http://localhost:3000/
   ```

---

## ⚙️ Environment Configuration

You can configure custom port and admin secret key using environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Server listening port |
| `ADMIN_KEY` | `change-me` | Secret key for admin moderation authorization |

Example:
```bash
PORT=8080 ADMIN_KEY=my-super-secret-key node server.js
```

---

## 🌐 Public Sharing & Cloud Deployment

### 1-Click Deployment to Render.com
1. Push your project to a GitHub repository.
2. Sign in to [Render](https://render.com/) and create a **New Web Service**.
3. Set **Build Command** to `npm install` and **Start Command** to `node server.js`.

---

## 📄 License

This project is developed as a Student Welfare Initiative for **The Apollo University**.
