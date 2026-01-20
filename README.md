# 🚀 Full-Stack MERN Authentication Template

A complete **Full-Stack Web Application** with User Authentication, Admin Panel, and CRUD operations using **MongoDB + Express.js + Vanilla JS + Node.js**.

---

## 📁 Project Structure

```
exam-template/
├── server/
│   ├── index.js          # Backend API server
│   ├── .env              # Environment variables
│   └── package.json      # Dependencies
├── client/
│   ├── login.html        # Login page
│   ├── signup.html       # Registration page
│   ├── dashboard.html    # User dashboard
│   ├── admin.html        # Admin panel
│   ├── auth.js           # Auth utilities
│   ├── index.html        # (Legacy CRUD demo)
│   └── script.js         # (Legacy CRUD demo)
├── .gitignore
└── README.md
```

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Set Up MongoDB Atlas (Free Cloud Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new **Cluster** (choose the FREE tier)
3. Click **"Connect"** → **"Connect your application"**
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/
   ```
5. Replace `<username>` and `<password>` with your credentials

### Step 2: Configure Environment Variables

Create/update `server/.env`:
```env
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster.xxxxx.mongodb.net/
JWT_SECRET=your_super_secret_key_change_this
```

> ⚠️ **Important:** Never commit `.env` to Git! It's already in `.gitignore`

### Step 3: Install Dependencies

```bash
cd server
npm install
```

### Step 4: Start the Server

```bash
npm start
```

You should see:
```
Default admin created: admin@example.com / admin123
Server running on http://localhost:3000
```

### Step 5: Open Frontend

Right-click `client/login.html` → **Open with Live Server** (VS Code extension)

Or simply open the HTML file in your browser.

---

## 🔐 Default Accounts

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@example.com  | admin123  |

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint            | Body                              | Description      |
|--------|---------------------|-----------------------------------|------------------|
| POST   | `/api/auth/register`| `{name, email, password}`         | Register user    |
| POST   | `/api/auth/login`   | `{email, password}`               | Login, get JWT   |

### User Endpoints (Requires JWT Token)

| Method | Endpoint        | Body                    | Description         |
|--------|-----------------|-------------------------|---------------------|
| GET    | `/api/users/me` | -                       | Get own profile     |
| PUT    | `/api/users/me` | `{name, email, password}` | Update own profile |

### Admin Endpoints (Requires Admin JWT)

| Method | Endpoint          | Body                 | Description       |
|--------|-------------------|----------------------|-------------------|
| GET    | `/api/users`      | -                    | Get all users     |
| PUT    | `/api/users/:id`  | `{name, email, role}`| Update any user   |
| DELETE | `/api/users/:id`  | -                    | Delete user       |

### Using JWT Token

Include in request headers:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📝 Backend CRUD Template Code

### Basic Express.js Server Setup

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db, collection;

async function connectDB() {
    await client.connect();
    db = client.db('myDatabase');           // Change database name
    collection = db.collection('items');     // Change collection name
}

// Start server
connectDB().then(() => {
    app.listen(3000, () => console.log('Server running on port 3000'));
});
```

### CREATE - Add New Item

```javascript
app.post('/items', async (req, res) => {
    const newItem = req.body;
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
});
```

### READ - Get All Items

```javascript
app.get('/items', async (req, res) => {
    const items = await collection.find({}).toArray();
    res.json(items);
});
```

### READ - Get Single Item by ID

```javascript
app.get('/items/:id', async (req, res) => {
    const item = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
});
```

### UPDATE - Modify Item

```javascript
app.put('/items/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    await collection.updateOne(
        { _id: new ObjectId(id) }, 
        { $set: updatedData }
    );
    res.json({ _id: id, ...updatedData });
});
```

### DELETE - Remove Item

```javascript
app.delete('/items/:id', async (req, res) => {
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Deleted successfully' });
});
```

---

## 🔒 Authentication Template Code

### Password Hashing with bcrypt

```javascript
const bcrypt = require('bcryptjs');

// Hash password before saving
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password on login
const isValid = await bcrypt.compare(inputPassword, storedHashedPassword);
```

### JWT Token Generation

```javascript
const jwt = require('jsonwebtoken');

// Generate token after login
const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

### JWT Middleware (Protect Routes)

```javascript
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Use middleware on protected routes
app.get('/api/users/me', authenticateToken, async (req, res) => {
    // req.user contains the decoded JWT payload
});
```

### Admin-Only Middleware

```javascript
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}

// Chain middlewares
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    // Only admins can access this
});
```

---

## 🎨 Frontend Template Code

### API Call with JWT Token

```javascript
async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null
    });
    
    return response.json();
}
```

### Login and Store Token

```javascript
async function login(email, password) {
    const result = await apiCall('/api/auth/login', 'POST', { email, password });
    
    if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = 'dashboard.html';
    }
}
```

### Check Authentication

```javascript
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function getUser() {
    return JSON.parse(localStorage.getItem('user'));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
```

### Protect Page (Redirect if Not Logged In)

```javascript
// Put at top of protected page's script
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^5.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^6.3.0",
    "nodemon": "^3.0.0"
  }
}
```

Install all:
```bash
npm install express cors dotenv mongodb bcryptjs jsonwebtoken nodemon
```

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Check your connection string in `.env`
- Ensure your IP is whitelisted in MongoDB Atlas (Network Access → Add IP → 0.0.0.0/0)
- Check your username/password

### "CORS Error"
- Make sure `app.use(cors())` is before your routes
- Restart the server after changes

### "Token Invalid/Expired"
- Clear localStorage: `localStorage.clear()`
- Login again to get a fresh token

### "Cannot find module"
- Run `npm install` in the server folder
- Check package.json has all dependencies

---

## ✅ Quick Customization Guide

### To Change Entity Name (e.g., "items" → "products"):

1. **Backend (`index.js`):**
   - Change `collection = db.collection('items')` → `'products'`
   - Change route paths `/items` → `/products`

2. **Frontend (HTML/JS):**
   - Update API URL: `const API = 'http://localhost:3000/products'`
   - Update form field IDs and table columns

### To Add New Fields:

1. Update your HTML form with new input fields
2. Update the `data` object in JavaScript to include new fields
3. No backend changes needed! MongoDB is schema-less

---

## 🎉 You're Ready!

You now have a complete template for:
- ✅ User registration & login
- ✅ JWT authentication
- ✅ Role-based access (User/Admin)
- ✅ CRUD operations
- ✅ Admin user management

**Happy Coding! 🚀**
