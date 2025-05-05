// routes/user.js
import express from 'express'
import pool from '../config/db'

const router = express.Router()

// 从id查找用户名
router.get('/:id', async (req, res) => {
  const authorId = req.params.id
  try {
    const result = await pool.query(
      `SELECT u.username
              FROM users u
              WHERE u.id = $1`,
      [authorId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('查询用户信息失败:', err)
    res.status(500).json({ error: 'Internal server error' })
    return
  }
}
)
export default router