const express = require('express');
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Total resources
    const resourceCount = await pool.query('SELECT COUNT(*) FROM resources');
    stats.totalResources = parseInt(resourceCount.rows[0].count);

    // Active bookings (approved, not in the past)
    const activeBookings = await pool.query(
      `SELECT COUNT(*) FROM bookings 
       WHERE status = 'approved' 
       AND (booking_date > CURRENT_DATE 
       OR (booking_date = CURRENT_DATE AND end_time > CURRENT_TIME))`
    );
    stats.activeBookings = parseInt(activeBookings.rows[0].count);

    // Pending bookings
    const pendingBookings = await pool.query(
      "SELECT COUNT(*) FROM bookings WHERE status = 'pending'"
    );
    stats.pendingBookings = parseInt(pendingBookings.rows[0].count);

    // Total users
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    stats.totalUsers = parseInt(userCount.rows[0].count);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending bookings for approval
router.get('/pending-bookings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
              u.first_name, u.last_name, u.email, u.user_type,
              r.name as resource_name, r.location
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN resources r ON b.resource_id = r.resource_id
       WHERE b.status = 'pending'
       ORDER BY b.created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve booking
router.put('/bookings/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE bookings SET status = 'approved' WHERE booking_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking approved successfully', booking: result.rows[0] });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject booking
router.put('/bookings/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE bookings SET status = 'rejected' WHERE booking_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking rejected successfully', booking: result.rows[0] });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get resource utilization statistics
router.get('/utilization', async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year'
    
    let interval = '7 days';
    if (period === 'month') interval = '30 days';
    if (period === 'year') interval = '365 days';

    // Get week date range for display
    const weekRange = await pool.query(
      `SELECT 
        TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'Mon DD') as start_date,
        TO_CHAR(CURRENT_DATE, 'Mon DD, YYYY') as end_date`
    );

    // Get total bookings in period for percentage calculation
    const totalBookingsResult = await pool.query(
      `SELECT COUNT(*) as total FROM bookings 
       WHERE status = 'approved' 
       AND booking_date >= CURRENT_DATE - INTERVAL '${interval}'`
    );
    const totalBookings = parseInt(totalBookingsResult.rows[0].total) || 1;

    // Get utilization per resource
    const result = await pool.query(
      `SELECT r.resource_id, r.name, r.location, r.category,
              COUNT(b.booking_id) as booking_count
       FROM resources r
       LEFT JOIN bookings b ON r.resource_id = b.resource_id 
         AND b.status = 'approved'
         AND b.booking_date >= CURRENT_DATE - INTERVAL '${interval}'
       GROUP BY r.resource_id, r.name, r.location, r.category
       ORDER BY booking_count DESC`
    );

    // Calculate percentage for each resource
    const utilization = result.rows.map(r => ({
      ...r,
      utilization_percentage: Math.round((r.booking_count / totalBookings) * 100)
    }));

    res.json({
      weekRange: weekRange.rows[0],
      resources: utilization
    });
  } catch (error) {
    console.error('Get utilization error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all bookings (with filters)
router.get('/all-bookings', async (req, res) => {
  try {
    const { status, startDate, endDate, resourceId } = req.query;

    let query = `
      SELECT b.*, 
             u.first_name, u.last_name, u.email,
             r.name as resource_name, r.location
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN resources r ON b.resource_id = r.resource_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (startDate) {
      query += ` AND b.booking_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND b.booking_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (resourceId) {
      query += ` AND b.resource_id = $${paramCount}`;
      params.push(resourceId);
      paramCount++;
    }

    query += ` ORDER BY b.booking_date DESC, b.start_time DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (for admin management)
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, email, first_name, last_name, user_type, student_id, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { userType } = req.body;

    if (!['student', 'faculty', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    const result = await pool.query(
      'UPDATE users SET user_type = $1 WHERE user_id = $2 RETURNING user_id, email, first_name, last_name, user_type',
      [userType, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated', user: result.rows[0] });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;