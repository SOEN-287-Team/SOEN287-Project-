// controllers/authController.js

const db = require("../db");
const bcrypt = require("bcrypt");

// ====================
// POST /api/auth/register
// ====================
async function registerUser(req, res) {
  try {
    console.log(">>> registerUser CALLED, body:", req.body);

    const { full_name, email, password, student_id } = req.body;

    if (!full_name || !email || !password || !student_id) {
      return res.status(400).json({
        message: "All fields required: full_name, email, password, student_id"
      });
    }

    // Check if email already exists
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.execute(
      "INSERT INTO users (full_name, email, password, student_id) VALUES (?, ?, ?, ?)",
      [full_name, email, hashedPassword, student_id]
    );

    console.log("✅ User registered successfully, ID:", result.insertId);

    return res.status(201).json({
      message: "Registration successful",
      userId: result.insertId
    });

  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      message: "Registration failed",
      error: err.message
    });
  }
}

// ====================
// POST /api/auth/login
// ====================
async function loginUser(req, res) {
  try {
    console.log(">>> loginUser CALLED, body:", req.body);
    console.log("Session before login:", req.session);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user by email
    const [rows] = await db.execute(
      "SELECT id, full_name, email, student_id, password FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = rows[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // 🔥 THIS IS THE CRITICAL FIX:
    // Store the entire user object in session (without password!)
    req.session.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      student_id: user.student_id
    };

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.status(500).json({
          message: "Login failed - session error"
        });
      }

      console.log("✅ Login successful, session:", req.session.user);
      console.log("Session after login:", req.session);

      return res.json({
        message: "Login successful",
        user: req.session.user
      });
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Login failed",
      error: err.message
    });
  }
}

// ====================
// POST /api/auth/logout
// ====================
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
}

function getCurrentUser(req, res) {
  try {
    console.log("getCurrentUser session:", req.session);

    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    return res.json({
      success: true,
      user: req.session.user
    });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  logout,
  getCurrentUser
};