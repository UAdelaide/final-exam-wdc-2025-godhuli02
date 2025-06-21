const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Connect DB
let db;
async function connectDB() {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
  });
  console.log('✅ Connected to DogWalkService');
}
connectDB();

// Endpoint to return all dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Dogs');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
