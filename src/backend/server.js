import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { openDb } from './db.js';
import { initializeDatabase } from './initDb.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Strips the password hash and returns only safe-to-expose user fields
function toPublicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profileCompleted: Boolean(user.profileCompleted),
  };
}

// Verifies candidatePassword against the stored hash.
// If the stored value is plain text (legacy), it matches directly and then
// automatically upgrades the record to a bcrypt hash for all future logins.
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

// ============================================================
// HEALTH CHECK
// ============================================================

// GET / — confirms the server is running
app.get('/', (_req, res) => {
  res.json({ message: 'Skillwise API is running' });
});

// ============================================================
// USER ROUTES — CRUD for user accounts
// ============================================================

// GET /api/users — return all user records (password excluded via toPublicUser)
app.get('/api/users', async (_req, res) => {
  try {
    const db = await openDb();
    const users = await db.all('SELECT id, firstName, lastName, email, profileCompleted FROM users');
    res.json(users.map(toPublicUser));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id — return a single user by id (password excluded)
app.get('/api/users/:id', async (req, res) => {
  try {
    const db = await openDb();
    // SELECT * is used internally; password is stripped by toPublicUser before sending
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(toPublicUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================================
// AUTH ROUTES — register, login, one-time setup, password reset
// ============================================================

// POST /api/auth/register — create a new account with email and hashed password
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

// POST /api/auth/login — verify credentials and return the user object
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

// POST /api/auth/setup-account — one-time name entry after first login
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

// POST /api/auth/reset-password — look up account by email and update password
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

// POST /api/users — create a fully-specified user (admin-style, all fields provided)
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

// PUT /api/users/:id — update any user field; re-hashes password if a new one is provided
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

// DELETE /api/users/:id — permanently remove a user record
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

// ============================================================
// MENTOR ROUTES — CRUD for mentor profiles
// ============================================================

// GET /api/mentors — return all mentor profiles with user info and average rating
app.get('/api/mentors', async (_req, res) => {
  try {
    const db = await openDb();
    // Join users for display name, LEFT JOIN reviews to compute average rating
    const mentors = await db.all(`
      SELECT m.*,
             u.firstName, u.lastName, u.email,
             ROUND(AVG(r.rating), 1) AS avgRating,
             COUNT(r.id) AS reviewCount
      FROM mentors m
      JOIN users u ON m.userId = u.id
      LEFT JOIN reviews r ON r.mentorId = m.id
      GROUP BY m.id
      ORDER BY m.createdAt DESC
    `);
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// GET /api/mentors/:id — return a single mentor profile by id
app.get('/api/mentors/:id', async (req, res) => {
  try {
    const db = await openDb();
    const mentor = await db.get(`
      SELECT m.*,
             u.firstName, u.lastName, u.email,
             ROUND(AVG(r.rating), 1) AS avgRating,
             COUNT(r.id) AS reviewCount
      FROM mentors m
      JOIN users u ON m.userId = u.id
      LEFT JOIN reviews r ON r.mentorId = m.id
      WHERE m.id = ?
      GROUP BY m.id
    `, [req.params.id]);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    res.json(mentor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentor' });
  }
});

// POST /api/mentors — create a mentor profile for the given userId
app.post('/api/mentors', async (req, res) => {
  try {
    const { userId, bio, skills, credentials, hourlyRate, availability } = req.body;
    // userId and skills are the minimum required fields
    if (!userId || !skills) {
      return res.status(400).json({ error: 'userId and skills are required' });
    }
    const db = await openDb();
    // Verify the user exists
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Each user may only have one mentor profile
    const existing = await db.get('SELECT id FROM mentors WHERE userId = ?', [userId]);
    if (existing) return res.status(409).json({ error: 'Mentor profile already exists for this user' });
    const result = await db.run(
      'INSERT INTO mentors (userId, bio, skills, credentials, hourlyRate, availability) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, bio || '', skills.trim(), credentials || '', hourlyRate || 0, availability || '']
    );
    const mentor = await db.get('SELECT * FROM mentors WHERE id = ?', [result.lastID]);
    res.status(201).json(mentor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create mentor profile' });
  }
});

// PUT /api/mentors/:id — update an existing mentor profile
app.put('/api/mentors/:id', async (req, res) => {
  try {
    const { bio, skills, credentials, hourlyRate, availability } = req.body;
    const db = await openDb();
    const existing = await db.get('SELECT * FROM mentors WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Mentor not found' });
    // Only update fields that were provided; fall back to existing values for omitted ones
    await db.run(
      'UPDATE mentors SET bio = ?, skills = ?, credentials = ?, hourlyRate = ?, availability = ? WHERE id = ?',
      [
        bio ?? existing.bio,
        skills ?? existing.skills,
        credentials ?? existing.credentials,
        hourlyRate ?? existing.hourlyRate,
        availability ?? existing.availability,
        req.params.id,
      ]
    );
    const updated = await db.get('SELECT * FROM mentors WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mentor profile' });
  }
});

// DELETE /api/mentors/:id — remove a mentor profile
app.delete('/api/mentors/:id', async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.run('DELETE FROM mentors WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Mentor not found' });
    res.json({ message: 'Mentor profile deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mentor profile' });
  }
});

// ============================================================
// REVIEW ROUTES — CRUD for mentor reviews
// ============================================================

// GET /api/reviews?mentorId=X — return all reviews for a mentor, newest first
app.get('/api/reviews', async (req, res) => {
  try {
    const { mentorId } = req.query;
    if (!mentorId) return res.status(400).json({ error: 'mentorId query param required' });
    const db = await openDb();
    // Join reviewer name so the front end can display who left each review
    const reviews = await db.all(`
      SELECT r.*, u.firstName, u.lastName
      FROM reviews r
      JOIN users u ON r.reviewerId = u.id
      WHERE r.mentorId = ?
      ORDER BY r.createdAt DESC
    `, [mentorId]);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews — add a review for a mentor
app.post('/api/reviews', async (req, res) => {
  try {
    const { mentorId, reviewerId, rating, comment } = req.body;
    if (!mentorId || !reviewerId || !rating) {
      return res.status(400).json({ error: 'mentorId, reviewerId, and rating are required' });
    }
    // Enforce 1–5 rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    const db = await openDb();
    // Prevent a mentor from reviewing their own profile
    const mentor = await db.get('SELECT userId FROM mentors WHERE id = ?', [mentorId]);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    if (Number(mentor.userId) === Number(reviewerId)) {
      return res.status(400).json({ error: 'Cannot review your own profile' });
    }
    const result = await db.run(
      'INSERT INTO reviews (mentorId, reviewerId, rating, comment) VALUES (?, ?, ?, ?)',
      [mentorId, reviewerId, rating, comment || '']
    );
    // Return new review with reviewer name included
    const review = await db.get(`
      SELECT r.*, u.firstName, u.lastName
      FROM reviews r
      JOIN users u ON r.reviewerId = u.id
      WHERE r.id = ?
    `, [result.lastID]);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// DELETE /api/reviews/:id — remove a review by id
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ============================================================
// MESSAGE ROUTES — direct messages between users
// ============================================================

// GET /api/messages?userId=X — return all messages sent or received by a user
app.get('/api/messages', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const db = await openDb();
    // Join sender and receiver names for display in the inbox
    const messages = await db.all(`
      SELECT m.*,
             s.firstName AS senderFirstName, s.lastName AS senderLastName,
             r.firstName AS receiverFirstName, r.lastName AS receiverLastName
      FROM messages m
      JOIN users s ON m.senderId = s.id
      JOIN users r ON m.receiverId = r.id
      WHERE m.senderId = ? OR m.receiverId = ?
      ORDER BY m.sentAt DESC
    `, [userId, userId]);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages — send a direct message to another user
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: 'senderId, receiverId, and content are required' });
    }
    // Disallow messaging yourself
    if (Number(senderId) === Number(receiverId)) {
      return res.status(400).json({ error: 'Cannot send a message to yourself' });
    }
    const db = await openDb();
    // Verify both users exist before inserting the message
    const sender = await db.get('SELECT id FROM users WHERE id = ?', [senderId]);
    const receiver = await db.get('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (!sender || !receiver) return res.status(404).json({ error: 'Sender or receiver not found' });
    const result = await db.run(
      'INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content.trim()]
    );
    // Return the new message with sender/receiver names
    const msg = await db.get(`
      SELECT m.*,
             s.firstName AS senderFirstName, s.lastName AS senderLastName,
             r.firstName AS receiverFirstName, r.lastName AS receiverLastName
      FROM messages m
      JOIN users s ON m.senderId = s.id
      JOIN users r ON m.receiverId = r.id
      WHERE m.id = ?
    `, [result.lastID]);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// DELETE /api/messages/:id — delete a message by id
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ============================================================
// PAYMENT ROUTES — session booking and payment records
// ============================================================

// GET /api/payments?userId=X — payments where the user is the payer or the mentor
app.get('/api/payments', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const db = await openDb();
    // Join payer name, mentor user name, and mentor skills for display
    const payments = await db.all(`
      SELECT p.*,
             u.firstName AS payerFirstName, u.lastName AS payerLastName,
             mu.firstName AS mentorFirstName, mu.lastName AS mentorLastName,
             m.skills
      FROM payments p
      JOIN users u ON p.payerId = u.id
      JOIN mentors m ON p.mentorId = m.id
      JOIN users mu ON m.userId = mu.id
      WHERE p.payerId = ? OR m.userId = ?
      ORDER BY p.createdAt DESC
    `, [userId, userId]);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/payments — record a session booking and payment
app.post('/api/payments', async (req, res) => {
  try {
    const { payerId, mentorId, amount, currency } = req.body;
    if (!payerId || !mentorId || amount == null) {
      return res.status(400).json({ error: 'payerId, mentorId, and amount are required' });
    }
    const db = await openDb();
    // Verify the mentor exists and prevent self-booking
    const mentor = await db.get('SELECT * FROM mentors WHERE id = ?', [mentorId]);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    if (Number(mentor.userId) === Number(payerId)) {
      return res.status(400).json({ error: 'Cannot book your own session' });
    }
    const result = await db.run(
      'INSERT INTO payments (payerId, mentorId, amount, currency, status) VALUES (?, ?, ?, ?, ?)',
      [payerId, mentorId, amount, currency || 'USD', 'completed']
    );
    const payment = await db.get('SELECT * FROM payments WHERE id = ?', [result.lastID]);
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// PUT /api/payments/:id — update the status of a payment (e.g. issue a refund)
app.put('/api/payments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'completed', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'status must be: pending, completed, or refunded' });
    }
    const db = await openDb();
    const result = await db.run('UPDATE payments SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Payment not found' });
    const updated = await db.get('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
