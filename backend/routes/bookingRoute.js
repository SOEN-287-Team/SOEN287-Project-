const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingController');

router.get('/', controller.getBookings);
router.post('/', controller.createBooking);
router.delete('/:id/cancel', controller.cancelBooking);


module.exports = router;
