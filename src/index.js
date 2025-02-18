const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const articleRoutes = require('./routes/articles');
const cors = require('cors');

const app = express();

// 启用 CORS 支持
app.use(cors());

// 连接数据库
connectDB();

// 中间件：解析请求体中的 JSON 数据
app.use(bodyParser.json());

// 使用路由
app.use(articleRoutes);

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});