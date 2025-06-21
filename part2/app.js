const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const session = require('express-session');
app.use(session({
  secret: 'walkies-secret',
  resave: false,
  saveUninitialized: false,
}));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
  });

  const [rows] = await db.execute(
    'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
    [username, password]
  );

  if (rows.length === 1) {
    req.session.user = { id: rows[0].user_id, role: rows[0].role };
    res.json({ role: rows[0].role });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;