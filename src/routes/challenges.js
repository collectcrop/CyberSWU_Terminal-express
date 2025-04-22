// routes/challenges.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/by-category/:id', async (req, res) => {
    const categoryId = req.params.id;
  
    // 查询该一级分类下所有的二级分类
    const subcategories = await pool.query(`
      SELECT sc.id, sc.name FROM subcategories sc
      WHERE sc.category_id = $1
    `, [categoryId]);
  
    // 查询所有该一级分类下的题目，并按二级分类分组
    const challenges = await pool.query(`
      SELECT c.id, c.title, c.subcategory_id
      FROM challenges c
      WHERE c.category_id = $1
    `, [categoryId]);
  
    const result = subcategories.rows.map(sub => ({
      ...sub,
      title: sub.name,
      children: challenges.rows.filter(c => c.subcategory_id === sub.id)
    }));
  
    res.json(result);
  });

// 获取某个具体 challenge 的信息
router.get('/:id', async (req, res) => {
  const challengeId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT *
        FROM challenges c
        WHERE c.id = $1`,
      [challengeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('查询题目信息失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
module.exports = router;