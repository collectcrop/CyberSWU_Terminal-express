// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer xxx",&&短路求值避免undefine情况
  console.log("check token: "+token)
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.error('Token verify failed:', err.name, err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user; // 把解码后的 user 对象挂到 req 上
    next();
  });
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: '用户或密码错误' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: '用户或密码错误' });

    const token = jwt.sign({ id: user.id, username: user.username , email: user.email }, SECRET, {
      expiresIn: '2h',
    });

    res.json({ message: '登录成功', token , user: { id: user.id, username: user.username, email: user.email }});
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

    // 检查邮箱是否已存在
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: '邮箱已被注册' });
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

router.post('/forgot-password', async (req, res) => {   // 忘记密码
  const { email } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: '邮箱未注册' });
    }

    // 生成 token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 分钟有效

    // 保存 token 到数据库
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [token, expiry, email]
    );

    // 构造重置链接
    const resetUrl = `http://localhost:3000/reset-password/${token}`;

    // 发邮件（使用 nodemailer）
    await sendResetEmail(email, resetUrl);

    res.json({ message: '已发送重置链接到您的邮箱' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

async function sendResetEmail(to, link) {
  const transporter = nodemailer.createTransport({
    service: 'QQ', // 或 'Gmail' 等
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: '"CTF平台" <2583727188@qq.com>',
    to,
    subject: '密码重置',
    html: `<p>点击以下链接重置密码（15分钟内有效）：</p>
           <a href="${link}">${link}</a>`,
  };
  await transporter.sendMail(mailOptions);
}

router.post('/reset-password/:token', async (req, res) => {   // 重置密码
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: '链接已失效或无效' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = $2',
      [hashed, token]
    );

    res.json({ message: '密码重置成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/validate-reset-token/:token', async (req, res) => {    // 验证重置链接
  const { token } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    if (result.rows.length === 0) {
      return res.json({ valid: false });
    }
    res.json({ valid: true });
  } catch (err) {
    console.error('验证 token 错误:', err);
    res.status(500).json({ valid: false });
  }
});

// router.get("/check-admin/:token", async (req, res) => {    // 检查是否为管理员
//   console.log("check-admin");
//   const { token } = req.params;
//   if (token) {
//     try {
//       const userId = JSON.parse(atob(token.split('.')[1])).id;
//       const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
//       const role = result.rows[0].role;
//       if (role === 'admin') {
//         res.json({ isAdmin: true });
//       } else {
//         res.json({ isAdmin: false });
//       }
//       return;
//     } catch (e) {
//       console.error("Token 解码失败", e);
//     }
//   }
//   else{
//     res.json({ error: "no token offered" });
//   }
// }
// )

router.get("/check-admin", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // 从 token 中间件获取
    console.log(userId)
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const role = result.rows[0]?.role;

    res.json({ isAdmin: role === 'admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/check-token', authenticateToken, (req, res) => {
  // 如果 token 有效，authenticateToken 会调用 next() 到这里
  res.json({
    message: 'Token 有效',
    user: req.user,  // 包含 id、username、email 等
  });
});
module.exports = router;
