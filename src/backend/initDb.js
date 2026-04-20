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

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  }
}
