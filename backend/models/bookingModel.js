const db = require("../db");

// Check overlapping bookings
async function checkConflict(resource_id, booking_date, start_time, end_time) {
  const [rows] = await db.execute(
    `
    SELECT booking_id FROM bookings
    WHERE resource_id = ?
      AND booking_date = ?
      AND status <> 'cancelled'
      AND (
        (start_time < ? AND end_time > ?)
        OR
        (start_time >= ? AND start_time < ?)
        OR
        (end_time > ? AND end_time <= ?)
      )
    `,
    [
      resource_id,
      booking_date,
      end_time, start_time,
      start_time, end_time,
      start_time, end_time
    ]
  );
  return rows.length > 0;
}

async function createBooking({ resource_id, user_id, booking_date, start_time, end_time, title }) {
  const [result] = await db.execute(
    `
    INSERT INTO bookings (resource_id, user_id, booking_date, start_time, end_time, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
    `,
    [resource_id, user_id, booking_date, start_time, end_time]
  );
  return result.insertId;
}

async function getBookingsByUser(user_id) {
  const [rows] = await db.execute(
    `
    SELECT b.*, r.name AS resource_name, r.location
    FROM bookings b
    JOIN resources r ON b.resource_id = r.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC, b.start_time DESC
    `,
    [user_id]
  );
  return rows;
}

async function getBookingsByResource(resource_id) {
  const [rows] = await db.execute(
    `
    SELECT b.*, u.full_name AS user_name
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.resource_id = ?
    ORDER BY b.booking_date DESC, b.start_time DESC
    `,
    [resource_id]
  );
  return rows;
}

async function cancelBooking(booking_id, user_id) {
  const [result] = await db.execute(
    `
    UPDATE bookings
    SET status = 'cancelled'
    WHERE booking_id = ? AND user_id = ?
    `,
    [booking_id, user_id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  checkConflict,
  createBooking,
  getBookingsByUser,
  getBookingsByResource,
  cancelBooking
};