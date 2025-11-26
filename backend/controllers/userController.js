// controllers/userController.js
const db = require("../db");
const bcrypt = require("bcrypt");

// ====================
// GET /api/users/profile
// ====================
async function getProfile(req, res) {
  try {
    console.log(">>> getProfile CALLED:", req.session.user);

    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // We already stored everything we need in the session at login
    return res.json({
      message: "Profile loaded",
      user: req.session.user
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Failed to load profile" });
  }
}

// ====================
// POST /api/users/change-password
// ====================
async function changePassword(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "currentPassword and newPassword are required"
      });
    }

    const userId = req.session.user.id;

    const [rows] = await db.execute(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, userId]
    );

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Password change error:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
}

// ====================
// POST /api/users/logout  (optional, you also have auth logout)
// ====================
function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    return res.json({ message: "Logged out" });
  });
}

module.exports = {
  getProfile,
  changePassword,
  logout
};
