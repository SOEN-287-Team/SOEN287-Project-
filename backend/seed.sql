USE soen287project;

-- dev users (plaintext only for local testing)
INSERT INTO users (name, email, password, role)
VALUES ('Alice Student', 'alice@example.com', 'password123', 'student');

INSERT INTO resources (name, type, location, capacity, status)
VALUES ('Study Room 101', 'Room', 'Building B', 6, 'active');

INSERT INTO bookings (user_id, resource_id, date, time_slot, status)
VALUES (1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00-11:00', 'approved');