# Exam CRUD Template - Quick Reference

## Folder Structure
```
exam-template/
├── server/
│   ├── index.js      ← Backend routes
│   ├── .env          ← MongoDB connection
│   └── package.json
└── client/
    ├── index.html    ← Form + Table UI
    └── script.js     ← CRUD functions
```

## Quick Setup Steps

1. **Install dependencies**: `cd server && npm install`
2. **Update `.env`** with your MongoDB Atlas connection string
3. **Start server**: `npm start`
4. **Open client**: Right-click `index.html` → Open with Live Server

## What to Modify Based on Exam Question

### In `server/index.js`:
| Line | What to Change |
|------|----------------|
| `db = client.db('myDatabase')` | Change database name |
| `collection = db.collection('items')` | Change collection name |
| `/items` routes | Change to match your entity (e.g., `/products`) |

### In `client/index.html`:
- Change form fields to match your entity
- Update table headers

### In `client/script.js`:
- Change `API` URL if you renamed routes
- Update `data` object fields to match your entity
- Update table row template

## Example: If asked for "Product" with fields (title, brand, price, stock)

Just replace:
- "items" → "products"
- name → title
- description → brand
- category → stock
# exam-template
