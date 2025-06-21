const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

async function setupDB() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
  });

  console.log('✅ Connected to DogWalkService');

  // Seed Users
  const [userCount] = await db.execute('SELECT COUNT(*) AS count FROM Users');
  if (userCount[0].count === 0) {
    await db.execute(`
      INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hash1', 'owner'),
        ('bobwalker', 'bob@example.com', 'hash2', 'walker'),
        ('carol123', 'carol@example.com', 'hash3', 'owner'),
        ('davidwalker', 'david@example.com', 'hash4', 'walker'),
        ('emilyo', 'emily@example.com', 'hash5', 'owner')
    `);
    console.log('✅ Seeded Users');
  }

  // Seed Dogs
  const [dogCount] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
  if (dogCount[0].count === 0) {
    await db.execute(`
      INSERT INTO Dogs (name, size, owner_id) VALUES
        ('Max', 'medium', (SELECT user_id FROM Users WHERE username = 'alice123')),
        ('Bella', 'small', (SELECT user_id FROM Users WHERE username = 'carol123')),
        ('Rocky', 'large', (SELECT user_id FROM Users WHERE username = 'emilyo')),
        ('Milo', 'small', (SELECT user_id FROM Users WHERE username = 'alice123')),
        ('Luna', 'medium', (SELECT user_id FROM Users WHERE username = 'carol123'))
    `);
    console.log('✅ Seeded Dogs');
  }

  // Seed WalkRequests
  const [walkCount] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
  if (walkCount[0].count === 0) {
    const walkData = [
      ['Max', '2025-06-10 08:00:00', 30, 'Parklands', 'open'],
      ['Bella', '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'],
      ['Rocky', '2025-06-11 10:00:00', 60, 'Central Park', 'open'],
      ['Milo', '2025-06-12 07:30:00', 20, 'Riverside Trail', 'open'],
      ['Luna', '2025-06-13 17:00:00', 40, 'Eastwood Reserve', 'completed']
    ];

    for (const [dogName, datetime, duration, location, status] of walkData) {
      await db.execute(`
        INSERT INTO WalkRequests (dog_id, datetime, duration_minutes, location, status)
        VALUES (
          (SELECT dog_id FROM Dogs WHERE name = ?),
          ?, ?, ?, ?
        )
      `, [dogName, datetime, duration, location, status]);
    }

    console.log('✅ Seeded WalkRequests');
  }
}

// Example route (keep or extend)
app.get('/', (req, res) => {
  res.send('Dog Walking Service API running!');
});

setupDB().catch(err => {
  console.error('❌ Error during DB setup:', err);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
