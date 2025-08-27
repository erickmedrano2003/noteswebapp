// server/index.js
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET; 

// --- DATABASE CONNECTION ---
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// Authentication middleware to protect routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden (token is no longer valid)
        req.user = user; // Attach user payload (e.g., { id: 1 }) to the request
        next();
    });
};

// --- AUTH ROUTES ---
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, passwordHash]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        // Check for unique constraint violation (duplicate email)
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- API ROUTES  ---
app.get('/api/notes', authenticateToken, async (req, res) => {
    try {
        const notes = await pool.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(notes.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const newNote = await pool.query(
            'INSERT INTO notes (user_id, content) VALUES ($1, $2) RETURNING *',
            [req.user.id, content]
        );
        res.json(newNote.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const updatedNote = await pool.query(
            'UPDATE notes SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [content, id, req.user.id]
        );
        if (updatedNote.rows.length === 0) {
            return res.status(404).json({ msg: 'Note not found or user not authorized.' });
        }
        res.json(updatedNote.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'Note not found or user not authorized.' });
        }
        res.json({ msg: 'Note deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- SERVER LISTENER ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));