import { openDb } from './db.js';

export async function initializeDatabase() {
  try {
    const db = await openDb();

    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        profileCompleted INTEGER NOT NULL DEFAULT 0
      )
    `);

    const tableInfo = await db.all('PRAGMA table_info(users)');
    const hasProfileCompleted = tableInfo.some((column) => column.name === 'profileCompleted');

    if (!hasProfileCompleted) {
      await db.exec('ALTER TABLE users ADD COLUMN profileCompleted INTEGER NOT NULL DEFAULT 0');
    }

    await db.run(
      `UPDATE users
       SET profileCompleted = 1
       WHERE profileCompleted = 0
         AND TRIM(COALESCE(firstName, '')) <> ''
         AND TRIM(COALESCE(lastName, '')) <> ''`
    );

    // Create mentors table — one profile per user, stores skills and booking info
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mentors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL UNIQUE,
        bio TEXT NOT NULL DEFAULT '',
        skills TEXT NOT NULL DEFAULT '',
        credentials TEXT NOT NULL DEFAULT '',
        hourlyRate REAL NOT NULL DEFAULT 0,
        availability TEXT NOT NULL DEFAULT '',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create reviews table — users can rate and review mentor profiles
    await db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentorId INTEGER NOT NULL,
        reviewerId INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL DEFAULT '',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (mentorId) REFERENCES mentors(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create messages table — direct messages between any two users
    await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        content TEXT NOT NULL,
        sentAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create payments table — records session bookings and payment history
    await db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payerId INTEGER NOT NULL,
        mentorId INTEGER NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (payerId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mentorId) REFERENCES mentors(id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  }
}
