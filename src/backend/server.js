import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { openDb } from './db.js';
import { initializeDatabase } from './initDb.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

function toPublicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profileCompleted: Boolean(user.profileCompleted),
  };
}

async function checkPasswordAndUpgradeIfNeeded(db, user, candidatePassword) {
  const storedPassword = user.password;
  const isBcryptHash = typeof storedPassword === 'string' && storedPassword.startsWith('$2');

  if (isBcryptHash) {
    return bcrypt.compare(candidatePassword, storedPassword);
  }

  const isPlainMatch = storedPassword === candidatePassword;
  if (!isPlainMatch) {
    return false;
  }

  const upgradedHash = await bcrypt.hash(candidatePassword, 10);
  await db.run('UPDATE users SET password = ? WHERE id = ?', [upgradedHash, user.id]);
  return true;
}

app.get('/', (_req, res) => {
  res.json({ message: 'Skillwise API is running' });
});

app.get('/api/users', async (_req, res) => {
  try {
    const db = await openDb();
    const users = await db.all('SELECT id, firstName, lastName, email, profileCompleted FROM users');
    res.json(users.map(toPublicUser));
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

    res.json(toPublicUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO users (firstName, lastName, email, password, profileCompleted) VALUES (?, ?, ?, ?, ?)',
      ['', '', normalizedEmail, hashedPassword, 0]
    );

    const user = await db.get('SELECT id, firstName, lastName, email, profileCompleted FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await openDb();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await checkPasswordAndUpgradeIfNeeded(db, user, password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/setup-account', async (req, res) => {
  try {
    const { userId, firstName, lastName } = req.body;

    if (!userId || !firstName || !lastName) {
      return res.status(400).json({ error: 'User id, first name, and last name are required' });
    }

    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profileCompleted) {
      return res.status(409).json({ error: 'Account setup is already complete' });
    }

    await db.run(
      `UPDATE users
       SET firstName = ?, lastName = ?, profileCompleted = 1
       WHERE id = ?`,
      [firstName.trim(), lastName.trim(), userId]
    );

    const updatedUser = await db.get(
      'SELECT id, firstName, lastName, email, profileCompleted FROM users WHERE id = ?',
      [userId]
    );

    res.json({ user: toPublicUser(updatedUser) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to setup account' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const db = await openDb();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) {
      return res.status(404).json({ error: 'No account found for that email' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({ message: 'Password updated. You can now login.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO users (firstName, lastName, email, password, profileCompleted) VALUES (?, ?, ?, ?, ?)',
      [firstName.trim(), lastName.trim(), normalizedEmail, hashedPassword, 1]
    );

    const user = await db.get('SELECT id, firstName, lastName, email, profileCompleted FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json(toPublicUser(user));
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

    const resolvedPassword = password
      ? await bcrypt.hash(password, 10)
      : existingUser.password;

    const resolvedEmail = email ? email.trim().toLowerCase() : existingUser.email;

    await db.run(
      `UPDATE users
       SET firstName = ?, lastName = ?, email = ?, password = ?
       WHERE id = ?`,
      [
        firstName?.trim() ?? existingUser.firstName,
        lastName?.trim() ?? existingUser.lastName,
        resolvedEmail,
        resolvedPassword,
        req.params.id,
      ]
    );

    const updatedUser = await db.get('SELECT id, firstName, lastName, email, profileCompleted FROM users WHERE id = ?', [req.params.id]);
    res.json(toPublicUser(updatedUser));
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
