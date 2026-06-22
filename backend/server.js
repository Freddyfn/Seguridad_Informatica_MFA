require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otplib = require('otplib');
const qrcode = require('qrcode');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_for_mfa_assignment';

// Helper for DB queries
const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const getQuery = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

// Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, address, phone } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
        
        const existing = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        const hash = await bcrypt.hash(password, 10);
        const result = await runQuery('INSERT INTO users (name, address, phone, email, password) VALUES (?, ?, ?, ?, ?)', [name, address, phone, email, hash]);
        res.status(201).json({ message: 'User registered', userId: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(400).json({ status: 'FAILURE', message: 'Credenciales inválidas' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ status: 'FAILURE', message: 'Credenciales inválidas' });

        if (user.twofaEnabled === 1) {
            return res.json({ status: '2FA_REQUIRED', userId: user.id });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ status: 'SUCCESS', token, userId: user.id, email: user.email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/2fa/login-verify', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user || !user.twofaSecret) return res.status(400).json({ error: 'User or 2FA secret not found' });

        const isValid = otplib.authenticator.check(code, user.twofaSecret);
        if (!isValid) return res.status(400).json({ error: 'Código 2FA incorrecto' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ status: 'SUCCESS', token, userId: user.id, email: user.email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2FA SETUP ROUTES ---
app.post('/api/auth/2fa/generate-qr', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await getQuery('SELECT email FROM users WHERE id = ?', [userId]);
        
        const secret = otplib.authenticator.generateSecret();
        const otpauth = otplib.authenticator.keyuri(user.email, 'SecurityAgentApp', secret);
        
        await runQuery('UPDATE users SET twofaSecret = ?, twofaEnabled = 0 WHERE id = ?', [secret, userId]);
        
        const qrCodeBase64 = await qrcode.toDataURL(otpauth);
        res.json({ qrCodeBase64, secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/2fa/enable-verify', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        const user = await getQuery('SELECT twofaSecret FROM users WHERE id = ?', [userId]);

        if (!user || !user.twofaSecret) return res.status(400).json({ error: 'Secret no generado' });

        const isValid = otplib.authenticator.check(code, user.twofaSecret);
        if (!isValid) return res.status(400).json({ error: 'Código incorrecto' });

        await runQuery('UPDATE users SET twofaEnabled = 1 WHERE id = ?', [userId]);
        res.json({ message: '2FA activado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await getQuery('SELECT id, name, address, phone, email, twofaEnabled FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user.id, name: user.name, address: user.address, phone: user.phone, email: user.email, twofaEnabled: user.twofaEnabled === 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STORE ROUTES ---
app.get('/api/products', authMiddleware, async (req, res) => {
    try {
        const products = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM products', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const { product_id, total } = req.body;
        const date = new Date().toISOString();
        const result = await runQuery('INSERT INTO orders (user_id, product_id, total, status, date) VALUES (?, ?, ?, ?, ?)', [req.user.id, product_id, total, 'COMPLETED', date]);
        res.json({ message: 'Compra exitosa', orderId: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
