// routes/user.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 从id查找用户名
router.get('/:id', async (req, res) => {
    const authorId = req.params.id;
    try {
        const result = await pool.query(
            `SELECT u.username
              FROM users u
              WHERE u.id = $1`,
            [authorId]
          );
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
    } catch (err) {
      console.error('查询用户信息失败:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  )

module.exports = router;