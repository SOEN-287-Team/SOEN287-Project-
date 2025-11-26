const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.post("/", bookingController.create);
router.get("/my", bookingController.getMyBookings);
router.delete("/:id", bookingController.cancel);

module.exports = router;
