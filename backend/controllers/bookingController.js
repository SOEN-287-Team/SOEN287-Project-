const Booking = require('../models/bookingModel');

exports.getBookings = async (req, res, next) => {
  try {
    const { date, resource_id } = req.query;
    const data = await Booking.findByFilters({ date, resource_id });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const booking = req.body;
    const conflict = await Booking.checkConflict(booking);
    if (conflict) return res.status(409).json({ message: 'Conflict detected' });

    const id = await Booking.create(booking);
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    await Booking.cancel(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
