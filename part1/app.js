const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 8080;

app.use(express.json());

let db;

// Connect to DogWalkService database
async function setupDB() {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // use your MySQL root password here
      database: 'DogWalkService'
    });
    console.log('✅ Connected to DogWalkService database!');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
}

// Route 1: /api/dogs
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

// Route 2: /api/walkrequests/open
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

// Route 3: /api/walkers/summary
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
      LEFT JOIN WalkRequests r ON wr.request_id = r.request_id AND r.status = 'completed'
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

// Start server
app.listen(PORT, async () => {
  await setupDB();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
