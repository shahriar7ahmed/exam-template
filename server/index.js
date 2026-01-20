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

// Get all items
app.get('/items', async (req, res) => {
    const items = await collection.find({}).toArray();
    res.json(items);
});

// Create new item
app.post('/items', async (req, res) => {
    const newItem = req.body;
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
});

// Update item
app.put('/items/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
    res.json({ _id: id, ...updatedData });
});

// Delete item
app.delete('/items/:id', async (req, res) => {
    const id = req.params.id;
    await collection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Deleted successfully' });
});

connectDB().then(() => {
    app.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    });
});
