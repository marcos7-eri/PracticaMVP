import { DatabaseSync } from 'node:sqlite';
export function createDb(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS spots (id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS stays (id INTEGER PRIMARY KEY, plate TEXT NOT NULL, spot_id INTEGER NOT NULL REFERENCES spots(id), entered_at TEXT NOT NULL, exited_at TEXT, fee REAL);`);
  if (db.prepare('SELECT COUNT(*) AS n FROM spots').get().n === 0) {
    const add=db.prepare('INSERT INTO spots (code) VALUES (?)');
    for(let i=1;i<=8;i++) add.run(`A${i}`);
  }
  return db;
}
