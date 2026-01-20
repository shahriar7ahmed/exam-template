require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const client = new MongoClient(uri);

let db, usersCollection;

// ==================== DATABASE CONNECTION ====================
async function connectDB() {
    await client.connect();
    db = client.db('authDB');
    usersCollection = db.collection('users');

    // Create default admin if not exists
    const adminExists = await usersCollection.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await usersCollection.insertOne({
            name: 'Admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date()
        });
        console.log('Default admin created: admin@example.com / admin123');
    }
}

// ==================== JWT MIDDLEWARE ====================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Admin middleware - must be used after authenticateToken
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: 'user', // Default role
            createdAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertedId
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Find user
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== USER ROUTES (Protected) ====================

// Get current user profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await usersCollection.findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } } // Exclude password
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update current user profile
app.put('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (email) {
            // Check if email is taken by another user
            const existingUser = await usersCollection.findOne({
                email,
                _id: { $ne: new ObjectId(req.user.userId) }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            updateData.email = email;
        }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $set: updateData }
        );

        const updatedUser = await usersCollection.findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );

        res.json({ message: 'Profile updated', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== ADMIN ROUTES (Admin Only) ====================

// Get all users (Admin only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await usersCollection.find(
            {},
            { projection: { password: 0 } }
        ).toArray();

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update any user (Admin only)
app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const userId = req.params.id;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        const updatedUser = await usersCollection.findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } }
        );

        res.json({ message: 'User updated', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent deleting self
        if (userId === req.user.userId) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await usersCollection.deleteOne({ _id: new ObjectId(userId) });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== START SERVER ====================
connectDB().then(() => {
    app.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
        console.log('API Endpoints:');
        console.log('  POST /api/auth/register - Register new user');
        console.log('  POST /api/auth/login    - Login user');
        console.log('  GET  /api/users/me      - Get own profile');
        console.log('  PUT  /api/users/me      - Update own profile');
        console.log('  GET  /api/users         - Get all users (Admin)');
        console.log('  PUT  /api/users/:id     - Update user (Admin)');
        console.log('  DELETE /api/users/:id   - Delete user (Admin)');
    });
});
