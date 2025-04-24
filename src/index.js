// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// // 启用 CORS 支持
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const challengesRoutes = require('./routes/challenges');
const userRoutes = require('./routes/user');
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengesRoutes)
app.use('/api/user', userRoutes)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});