// server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// MIDDLEWARES
// ====================


app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500", 
      "http://127.0.0.1:5501"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SESSION MIDDLEWARE
app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hrs
      sameSite: "lax",
      secure: false 
    }
  })
);

console.log("Server.js is running");

// ====================
// TEST ROUTES
// ====================

app.get("/", (req, res) => {
  res.send("Backend is working");
});

app.post("/api/test-register", (req, res) => {
  console.log(">>> /api/test-register triggered, body:", req.body);
  res.json({ message: "Test register OK" });
});

app.get("/test-db", async (req, res) => {
  try {
    console.log("Type of db:", typeof db);
    const [rows] = await db.execute("SELECT 'Hello World!' AS message");
    res.json(rows[0]);
  } catch (err) {
    console.log("Database test error:", err);
    return res.status(500).json({
      error: "Database query failed",
      details: err.message,
      code: err.code
    });
  }
});

// ====================
// REAL ROUTES
// ====================

app.use("/api/auth", authRoutes);   // /api/auth/register, /api/auth/login, ...
app.use("/api/users", userRoutes);  // /api/users/profile, /api/users/change-password
app.use("/api/bookings", bookingRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/admin", adminRoutes);

// ====================
// ERROR HANDLER
// ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ====================
// START SERVER
// ====================

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
