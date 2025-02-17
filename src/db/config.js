const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'parking_system',
  password: 'your_password',
  port: 5432,
});

module.exports = pool;

const API_URL = 'http://localhost:5000/api';

const api = {
  getParkingSlots: async () => {
    const response = await fetch(`${API_URL}/parking-slots`);
    if (!response.ok) throw new Error('Failed to fetch parking slots');
    return response.json();
  },

  updateParkingSlot: async (slotId, data) => {
    const response = await fetch(`${API_URL}/parking-slots/${slotId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update parking slot');
    return response.json();
  },

  addParkingHistory: async (data) => {
    const response = await fetch(`${API_URL}/parking-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add parking history');
    return response.json();
  }
};

export default api; 