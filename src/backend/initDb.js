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
        password TEXT NOT NULL
      )
    `);

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  }
}
