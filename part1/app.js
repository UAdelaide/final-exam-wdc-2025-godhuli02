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

    console.log('✅ Connected to DogWalkService database');

    // Insert users if empty
    const [users] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (users[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('davidwalker', 'david@example.com', 'hashed111', 'walker'),
        ('emilyO', 'emily@example.com', 'hashed999', 'owner')
      `);
      console.log('✅ Inserted users');
    }

    // Insert dogs if empty
    const [dogs] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (dogs[0].count === 0) {
      await db.execute(`
        INSERT INTO Dogs (name, size, owner_id) VALUES
        ('Max', 'medium', (SELECT user_id FROM Users WHERE username = 'alice123')),
        ('Bella', 'small', (SELECT user_id FROM Users WHERE username = 'carol123')),
        ('Rocky', 'large', (SELECT user_id FROM Users WHERE username = 'emilyO')),
        ('Milo', 'small', (SELECT user_id FROM Users WHERE username = 'alice123')),
        ('Luna', 'medium', (SELECT user_id FROM Users WHERE username = 'carol123'))
      `);
      console.log('✅ Inserted dogs');
    }

    // Insert walk requests if empty
    const [walks] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (walks[0].count === 0) {
      await db.execute(`
        INSERT INTO WalkRequests (dog_id, date_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Rocky'), '2025-06-11 10:00:00', 60, 'Central Park', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Milo'), '2025-06-12 07:30:00', 20, 'Riverside Trail', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Luna'), '2025-06-13 17:00:00', 40, 'Eastwood Reserve', 'completed')
      `);
      console.log('✅ Inserted walk requests');
    }

  } catch (err) {
    console.error('❌ Error setting up database:', err);
  }
}

// API ROUTES

// GET /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// GET /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        wr.request_id,
        d.name AS dog_name,
        wr.date_time AS requested_time,
        wr.duration_minutes,
        wr.location,
        u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// GET /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(wr.rating_id) AS total_ratings,
        ROUND(AVG(wr.rating), 1) AS average_rating,
        COUNT(DISTINCT r.request_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings wr ON wr.walker_id = u.user_id
      LEFT JOIN WalkRequests r ON r.request_id = wr.request_id AND r.status = 'completed'
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

// Start the server
app.listen(PORT, async () => {
  await setupDB();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
