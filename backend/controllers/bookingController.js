const bookingModel = require("../models/bookingModel");

async function create(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { resource_id, start_time, end_time, title } = req.body;

    if (!resource_id || !start_time || !end_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const conflict = await bookingModel.checkConflict(resource_id, start_time, end_time);
    if (conflict) {
      return res.status(409).json({ message: "Time slot already booked" });
    }

    const bookingId = await bookingModel.createBooking({
      resource_id,
      user_id: req.session.user.id,
      start_time,
      end_time,
      title
    });

    return res.status(201).json({ message: "Booking created", bookingId });
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({ message: "Failed" });
  }
}

async function getMyBookings(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const rows = await bookingModel.getBookingsByUser(req.session.user.id);
    return res.json({ bookings: rows });
  } catch (err) {
    console.error("Get bookings error:", err);
    return res.status(500).json({ message: "Failed" });
  }
}

async function cancel(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const ok = await bookingModel.cancelBooking(req.params.id, req.session.user.id);
    if (!ok) {
      return res.status(404).json({ message: "Booking not found or not yours" });
    }

    return res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("Cancel error:", err);
    return res.status(500).json({ message: "Failed" });
  }
}

module.exports = {
  create,
  getMyBookings,
  cancel
};
