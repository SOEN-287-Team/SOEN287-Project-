const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware: Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Apply admin check to all routes
router.use(requireAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Total resources
    const [resourceRows] = await db.execute('SELECT COUNT(*) as count FROM resources');
    stats.totalResources = parseInt(resourceRows[0].count);

    // Active bookings (approved, not in the past)
    const [activeRows] = await db.execute(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE status = 'approved'
       AND (booking_date > CURDATE() 
       OR (booking_date = CURDATE() AND end_time > CURTIME()))`
    );
    stats.activeBookings = parseInt(activeRows[0].count);

    // Pending bookings
    const [pendingRows] = await db.execute(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE status = 'pending'`
    );
    stats.pendingBookings = parseInt(pendingRows[0].count);

    // Total users
    const [userRows] = await db.execute('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = parseInt(userRows[0].count);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending bookings for approval
router.get('/pending-bookings', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT b.*, 
              u.full_name, u.email, u.role, u.student_id,
              r.name as resource_name, r.location
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN resources r ON b.resource_id = r.id
       WHERE b.status = 'pending'
       ORDER BY b.created_at ASC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve booking
router.put('/bookings/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `UPDATE bookings SET status = 'approved' WHERE booking_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get updated booking
    const [booking] = await db.execute(
      `SELECT b.*, r.name as resource_name, u.full_name
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       JOIN users u ON b.user_id = u.id
       WHERE b.booking_id = ?`,
      [id]
    );

    res.json({ message: 'Booking approved successfully', booking: booking[0] });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject booking
router.put('/bookings/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `UPDATE bookings SET status = 'rejected' WHERE booking_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const [booking] = await db.execute(
      `SELECT b.*, r.name as resource_name, u.full_name
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       JOIN users u ON b.user_id = u.id
       WHERE b.booking_id = ?`,
      [id]
    );

    res.json({ message: 'Booking rejected successfully', booking: booking[0] });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get resource utilization statistics
router.get('/utilization', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let days = 7;
    if (period === 'month') days = 30;
    if (period === 'year') days = 365;

    // Get date range
    const [dateRange] = await db.execute(
      `SELECT 
        DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), '%b %d') as start_date,
        DATE_FORMAT(CURDATE(), '%b %d, %Y') as end_date`,
      [days]
    );

    // Get total bookings in period
    const [totalResult] = await db.execute(
      `SELECT COUNT(*) as total FROM bookings 
       WHERE status = 'approved'
       AND booking_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [days]
    );
    const totalBookings = parseInt(totalResult[0].total) || 1;

    // Get utilization per resource
    const [resources] = await db.execute(
      `SELECT r.id as resource_id, r.name, r.location, r.type, r.category,
              COUNT(b.booking_id) as booking_count
       FROM resources r
       LEFT JOIN bookings b ON r.id = b.resource_id 
         AND b.status = 'approved'
         AND b.booking_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY r.id, r.name, r.location, r.type, r.category
       ORDER BY booking_count DESC`,
      [days]
    );

    // Calculate percentage
    const utilization = resources.map(r => ({
      ...r,
      utilization_percentage: Math.round((r.booking_count / totalBookings) * 100)
    }));

    res.json({
      weekRange: dateRange[0],
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
             u.full_name, u.email, u.student_id,
             r.name as resource_name, r.location
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN resources r ON b.resource_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND b.booking_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND b.booking_date <= ?`;
      params.push(endDate);
    }

    if (resourceId) {
      query += ` AND b.resource_id = ?`;
      params.push(resourceId);
    }

    query += ` ORDER BY b.booking_date DESC, b.start_time DESC`;

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (for admin management)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id as user_id, email, full_name, role, student_id, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const [result] = await db.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [user] = await db.execute(
      'SELECT id as user_id, email, full_name, role FROM users WHERE id = ?',
      [id]
    );

    res.json({ message: 'User role updated', user: user[0] });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;