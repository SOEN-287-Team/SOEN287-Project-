const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db.js');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [username, username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Register error', err);
        res.status(500).json({ error: 'Database error' });
    }

});

module.exports = router;