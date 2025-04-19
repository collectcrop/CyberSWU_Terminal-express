// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: '用户或密码错误' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: '用户或密码错误' });

    const token = jwt.sign({ id: user.id, username: user.username ,role: user.role}, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.json({ message: '登录成功', token , user: { id: user.id, username: user.username }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 注册
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // 检查用户名是否已存在
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: '用户名已被注册' });
    }

    // 哈希密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 插入用户到数据库
    const newUser = await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username',
      [username, hashedPassword, email]
    );

    // 生成 token
    const token = jwt.sign(
      { id: newUser.rows[0].id, username: newUser.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(201).json({ message: '注册成功', token });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
module.exports = router;
