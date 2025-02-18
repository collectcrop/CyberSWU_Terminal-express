// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/articleList');
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);  // 连接失败时退出程序
  }
};

module.exports = connectDB;