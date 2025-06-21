const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 8080;

app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'DogWalkService',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ⬇️ DATABASE SETUP WITH SAMPLE DATA
async function setupDB() {
  try {
    const db = await pool.getConnection();

    // Insert Users
    const [users] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (users[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (username, email, role) VALUES
          ('alice123', 'alice@example.com', 'owner'),
          ('bobwalker', 'bob@example.com', 'walker'),
          ('carol123', 'carol@example.com', 'owner'),
          ('davidwalker', 'david@example.com', 'walker'),
          ('emilyo', 'emily@example.com', 'owner')
      `);
      console.log('✅ Inserted users');
    }

    // Insert Dogs
    const [dogs] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (dogs[0].count === 0) {
      await db.execute(`
        INSERT INTO Dogs (name, size, owner_id) VALUES
          ('Bella', 'small', (SELECT user_id FROM Users WHERE username = 'carol123')),
          ('Rocky', 'large', (SELECT user_id FROM Users WHERE username = 'emilyo')),
          ('Milo', 'small', (SELECT user_id FROM Users WHERE username = 'alice123')),
          ('Luna', 'medium', (SELECT user_id FROM Users WHERE username = 'carol123')),
          ('Max', 'medium', (SELECT user_id FROM Users WHERE username = 'alice123'))
      `);
      console.log('🐶 Inserted dogs');
    }

    // Insert Walk Requests
    const [walks] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (walks[0].count === 0) {
      const walkData = [
        ['Max', '2025-06-10 08:00:00', 30, 'Parklands', 'open'],
        ['Bella', '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'],
        ['Rocky', '2025-06-11 10:00:00', 60, 'Central Park', 'open'],
        ['Milo', '2025-06-12 07:30:00', 20, 'Riverside Trail', 'open'],
        ['Luna', '2025-06-13 17:00:00', 40, 'Eastwood Reserve', 'completed']
      ];

      for (const [dogName, date_time, duration, location, status] of walkData) {
        await db.execute(`
          INSERT INTO WalkRequests (dog_id, date_time, duration_minutes, location, status)
          VALUES (
            (SELECT dog_id FROM Dogs WHERE name = ?),
            ?, ?, ?, ?
          )
        `, [dogName, dateTime, duration, location, status]);
      }

      console.log('🚶 Inserted walk requests');
    }

    db.release();
  } catch (err) {
    console.error('❌ Error setting up database:', err);
  }
}

setupDB();

// ⬇️ ROUTES

app.get('/', (req, res) => {
  res.send('DogWalkService is running!');
});

// Get all dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT d.name, d.size, u.username AS owner
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// Get open walk requests
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
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
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// Walker summary endpoint
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        u.username AS walker,
        COUNT(wr.request_id) AS total_walks,
        IFNULL(AVG(r.rating), 0) AS avg_rating
      FROM Users u
      LEFT JOIN WalkApplications wa ON u.user_id = wa.walker_id
      LEFT JOIN WalkRequests wr ON wa.request_id = wr.request_id AND wr.status = 'completed'
      LEFT JOIN WalkRatings r ON wr.request_id = r.request_id
      WHERE u.role = 'walker'
      GROUP BY u.username
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

// ⬇️ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
