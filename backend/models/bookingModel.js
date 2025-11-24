const db = require('../db');

exports.findByFilters = async (filters = {}) => {
  // simple filter implementation: date, resource_id
  const conditions = [];
  const params = [];
  if (filters.date) {
    conditions.push('date = ?');
    params.push(filters.date);
  }
  if (filters.resource_id) {
    conditions.push('resource_id = ?');
    params.push(filters.resource_id);
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `SELECT b.*, r.name as resource_name FROM bookings b LEFT JOIN resources r ON b.resource_id = r.id ${where} ORDER BY date, time_slot`;
  const rows = await db.query(sql, params);
  return rows;
};

exports.checkConflict = async ({ resource_id, date, time_slot }) => {
  // naive conflict check: same resource, same date and identical time_slot
  const rows = await db.query(
    'SELECT * FROM bookings WHERE resource_id = ? AND date = ? AND time_slot = ? AND status != "cancelled"',
    [resource_id, date, time_slot]
  );
  return rows.length > 0;
};

exports.create = async (booking) => {
  const result = await db.query('INSERT INTO bookings SET ?', booking);
  // mysql returns an object with insertId
  return result.insertId;
};

exports.cancel = async (id) => {
  await db.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', id]);
};
