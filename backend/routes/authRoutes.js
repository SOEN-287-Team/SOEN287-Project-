// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  logout,
  getCurrentUser  
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.get("/me", getCurrentUser);  

module.exports = router;