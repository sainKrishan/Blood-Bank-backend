import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
    const { name, email, password, role, blood_group } = req.body;

    // Input validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }
    if (!['hospital', 'receiver'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either hospital or receiver.' });
    }
    if (role === 'receiver' && !blood_group) {
        return res.status(400).json({ message: 'Blood group is required for receivers.' });
    }

    try {
        // Check if email is already registered (prevents cross-role duplicate emails)
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'This email is already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (name, email, password, role, blood_group) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, role === 'receiver' ? blood_group : null]
        );

        res.status(201).json({ message: 'Registration successful.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // FIX: Include 'name' in JWT payload so the frontend can display it
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role, blood_group: user.blood_group },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, blood_group: user.blood_group }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
