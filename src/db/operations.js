const pool = require('./config');

const dbOperations = {
  // Get all parking slots
  getParkingSlots: async () => {
    try {
      const result = await pool.query('SELECT * FROM parking_slots ORDER BY id');
      return result.rows;
    } catch (error) {
      console.error('Error getting parking slots:', error);
      throw error;
    }
  },

  // Update parking slot status
  updateParkingSlot: async (slotId, isOccupied, entryTime = null, payment = 0) => {
    try {
      const query = `
        UPDATE parking_slots 
        SET is_occupied = $1, entry_time = $2, payment = $3
        WHERE id = $4
        RETURNING *
      `;
      const result = await pool.query(query, [isOccupied, entryTime, payment, slotId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating parking slot:', error);
      throw error;
    }
  },

  // Add parking history record
  addParkingHistory: async (slotId, entryTime, status) => {
    try {
      const query = `
        INSERT INTO parking_history (slot_id, entry_time, status)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await pool.query(query, [slotId, entryTime, status]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding parking history:', error);
      throw error;
    }
  },

  // Update parking history record
  updateParkingHistory: async (slotId, exitTime, duration, payment) => {
    try {
      const query = `
        UPDATE parking_history 
        SET exit_time = $1, duration = $2, payment = $3, status = 'Completed'
        WHERE slot_id = $4 AND exit_time IS NULL
        RETURNING *
      `;
      const result = await pool.query(query, [exitTime, duration, payment, slotId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating parking history:', error);
      throw error;
    }
  },

  // Update daily stats
  updateDailyStats: async (cars, earnings, parkingTime) => {
    try {
      const query = `
        INSERT INTO daily_stats (date, total_cars, total_earnings, total_parking_time)
        VALUES (CURRENT_DATE, $1, $2, $3)
        ON CONFLICT (date) 
        DO UPDATE SET 
          total_cars = daily_stats.total_cars + $1,
          total_earnings = daily_stats.total_earnings + $2,
          total_parking_time = daily_stats.total_parking_time + $3
        RETURNING *
      `;
      const result = await pool.query(query, [cars, earnings, parkingTime]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating daily stats:', error);
      throw error;
    }
  }
};

module.exports = dbOperations; 