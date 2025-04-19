// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// // 启用 CORS 支持
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});