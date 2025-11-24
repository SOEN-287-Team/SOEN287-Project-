const express = require("express");
const app = express();

const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoute');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
let PORT = process.env.PORT || 3000;

const db = require('./db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended : false}));

// Mount API routes
app.use('/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/resources', require('./routes/resourceRoute'));

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.use('/user', userRoutes);
app.use('/bookings', bookingRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});