const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect()
  .then(() => {
    console.log('Successfully connected to PostgreSQL');
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

// Add this after your database connection
const initializeDatabase = async () => {
  try {
    // Check if parking slots exist
    const result = await pool.query('SELECT COUNT(*) FROM parking_slots');
    if (result.rows[0].count === '0') {
      // Initialize parking slots
      const values = Array(16).fill().map((_, i) => `(${i + 1}, false)`).join(',');
      await pool.query(`
        INSERT INTO parking_slots (id, is_occupied)
        VALUES ${values}
      `);
      console.log('Initialized parking slots');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Call initialization
initializeDatabase();

// API Routes
app.get('/api/parking-slots', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parking_slots ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching parking slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/parking-slots/:id', async (req, res) => {
  const { id } = req.params;
  const { isOccupied, entryTime, payment } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE parking_slots SET is_occupied = $1, entry_time = $2, payment = $3 WHERE id = $4 RETURNING *',
      [isOccupied, entryTime, payment, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating parking slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/parking-history', async (req, res) => {
  const { slotId, entryTime, status } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO parking_history (slot_id, entry_time, status) VALUES ($1, $2, $3) RETURNING *',
      [slotId, entryTime, status]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding parking history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 