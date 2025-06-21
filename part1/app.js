const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 8080;

app.use(express.json());

let db;

async function setupDB() {
  try {
    db = await mysql.createConnection({
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
            ('alice123', 'alice@example.com', 'hashed123', 'owner'),
            ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
            ('carol123', 'carol@example.com', 'hashed789', 'owner'),
            ('davidwalker', 'david@example.com', 'hashed111', 'walker'),
            ('emilyo', 'emily@example.com', 'hashed999', 'owner')
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

      for (const [dogName, date_time, duration, location, status] of walkData) {
        await db.execute(
          `INSERT INTO WalkRequests (dog_id, date_time, duration_minutes, location, status)
           VALUES (
             (SELECT dog_id FROM Dogs WHERE name = ?),
             ?, ?, ?, ?
           )`,
          [dogName, date_time, duration, location, status]
        );
      }


      console.log('✅ Seeded WalkRequests');
    }

  } catch (err) {
    console.error('❌ Error during DB setup:', err);
  }
}

// ROUTES

// Root
app.get('/', (req, res) => {
  res.send('🐾 Dog Walking Service API is live!');
});

// /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute(`
      SELECT d.name, d.size, u.username AS owner
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(dogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [walks] = await db.execute(`
      SELECT d.name AS dog_name, wr.datetime, wr.duration_minutes, wr.location, u.username AS owner
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(walks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        u.username AS walker,
        COUNT(r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS average_rating,
        COUNT(DISTINCT wr.request_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      LEFT JOIN WalkRequests wr ON wr.request_id = r.request_id AND wr.status = 'completed'
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

// Server start
app.listen(PORT, async () => {
  await setupDB();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
