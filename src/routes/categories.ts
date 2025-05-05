// routes/challenges.js
import express from 'express'
import pool from '../config/db'

const router = express.Router()

router.get('/', async (req, res) => {           // 获取所有分类
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY "order" ASC')
    res.json(result.rows)
  } catch (err) {
    console.error('获取分类失败:', err)
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/reorder', async (req, res) => {           // 更新分类排序
  const { orderedIds } = req.body // e.g. [3, 1, 2]

  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ error: 'Invalid orderedIds' })
    return
  }

  try {
    const client = await pool.connect()        // 获取数据库连接,手动控制事务
    try {
      await client.query('BEGIN')

      for (let i = 0; i < orderedIds.length; i++) {       // 避免只成功更新前几个分类，所以采用事务管理
        await client.query(
          'UPDATE categories SET "order" = $1 WHERE id = $2',
          [i, orderedIds[i]]
        )
      }

      await client.query('COMMIT')           // 提交事务
      res.status(200).json({ success: true })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('更新排序失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

router.post('/add', async (req, res) => {       // 添加一级分类
  const { name } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, "order") VALUES ($1, (SELECT MAX("order") + 1 FROM categories)) RETURNING id, name',
      [name]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('添加分类失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
)

router.post('/add-subcategories', async (req, res) => {     // 添加二级分类
  const { name, from } = req.body
  try {
    const subcategories = await pool.query(
      'INSERT INTO subcategories (name, category_id) VALUES ($1, $2) RETURNING id, name',
      [name, from]
    )
    const result = subcategories.rows.map(sub => ({
      ...sub,
      title: sub.name,
      children: null              // 新的二级分类没有题目
    }))
    res.json(result)

  } catch (err) {
    console.error('添加分类失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
)

router.post('/delete', async (req, res) => {
  const { id } = req.body
  try {
    await pool.query(
      'DELETE FROM categories WHERE id = $1',
      [id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('删除分类失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }

})
export default router