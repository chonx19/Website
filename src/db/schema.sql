-- Create tables
CREATE TABLE parking_slots (
    id SERIAL PRIMARY KEY,
    is_occupied BOOLEAN DEFAULT false,
    entry_time TIMESTAMP,
    vehicle_type VARCHAR(50),
    payment DECIMAL(10,2) DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE parking_history (
    id SERIAL PRIMARY KEY,
    slot_id INTEGER REFERENCES parking_slots(id),
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    duration INTERVAL,
    payment DECIMAL(10,2),
    status VARCHAR(50)
);

CREATE TABLE daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    total_cars INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_parking_time INTERVAL DEFAULT '0'
); 