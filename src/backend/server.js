import express from 'express';
import cors from 'cors';
import { openDb } from './db.js';
import { initializeDatabase } from './initDb.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Skillwise API is running' });
});

app.get('/api/users', async (_req, res) => {
  try {
    const db = await openDb();
    const users = await db.all('SELECT * FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, password]
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json(user);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const db = await openDb();
    const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.run(
      `UPDATE users
       SET firstName = ?, lastName = ?, email = ?, password = ?
       WHERE id = ?`,
      [
        firstName ?? existingUser.firstName,
        lastName ?? existingUser.lastName,
        email ?? existingUser.email,
        password ?? existingUser.password,
        req.params.id,
      ]
    );

    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(updatedUser);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
