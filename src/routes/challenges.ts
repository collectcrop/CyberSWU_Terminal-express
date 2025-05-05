// routes/challenges.js
import express from 'express'
import pool from '../config/db'

const router = express.Router()

// 添加 challenge
router.post('/add', async (req, res) => {
  console.log(req.body)
  const { title, description, category_id, subcategory_id, flag, flagType, score, author_id,
    attachment_url, attachment_name, difficulty
  } = req.body
  try {
    const client = await pool.connect()        // 必须题目更新和flag表更新同时完成
    try {
      await client.query('BEGIN')
      const challengeInsertResult = await client.query(
        `INSERT INTO challenges (title, description, category_id, subcategory_id, score, author_id,
         attachment_url, attachment_name, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        `, [title, description, category_id, subcategory_id, score, author_id, attachment_url, attachment_name, difficulty])

      const challengeId = challengeInsertResult.rows[0].id

      await client.query(     // 插入 flag
        `INSERT INTO flags (flag, challenge_id, is_dynamic)
        VALUES ($1, $2, $3)
        `, [flag, challengeId, flagType === 'dynamic'])

      await client.query('COMMIT')           // 提交事务
      res.status(200).json({ success: true })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
  } catch {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

interface chkFlag{
  challengeId?: string;
  content?: string;
  userId?: string;
}

// 提交 flag 进行验证
router.post('/validate-flag', async (req, res) => {
  const { challengeId, content, userId } = (req.body as chkFlag) // 获取请求中的 challengeId 和 flag

  // 验证输入是否合法
  if (!challengeId || !content || !userId) {
    res.status(400).json({ error: 'Missing challengeId, flag, or userId' })
    return
  }

  try {
    // 查找该题目的 flag 信息
    const result = await pool.query(`
      SELECT flag, is_dynamic
      FROM flags
      WHERE challenge_id = $1
      AND (is_dynamic = FALSE OR (is_dynamic = TRUE AND user_id = $2))
    `, [challengeId, userId])

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Flag not found or not valid for this challenge' })
      return
    }

    const flagData = result.rows[0]

    // 如果是静态 flag，直接与存储的 flag 比较
    if (!flagData.is_dynamic) {
      if (content === flagData.flag) {
        await recordSolve(userId, challengeId) // 记录成功解题
        res.status(200).json({ success: true, message: 'Correct flag!' })
      } else {
        res.status(400).json({ error: 'Incorrect flag' })
      }
      return
    }

    // 如果是动态 flag，进行动态计算验证（这部分逻辑可以根据需求修改）
    if (flagData.is_dynamic) {
      // 假设有一个动态 flag 验证函数，可能是某种计算或者 API 请求
      const isDynamicValid = await validateDynamicFlag(content, challengeId, userId)

      if (isDynamicValid) {
        await recordSolve(userId, challengeId) // 记录成功解题
        res.status(200).json({ success: true, message: 'Correct flag!' })
      } else {
        res.status(400).json({ error: 'Incorrect flag' })
      }
      return
    }

  } catch (err) {
    console.error('Flag validation error:', err)
    res.status(500).json({ error: 'Internal server error' })
    return
  }
})

async function recordSolve (userId: string, challengeId: string) {
  try {
    // 插入解题记录，如果已经存在则忽略
    const insertRes = await pool.query(`
      INSERT INTO solves (user_id, challenge_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `, [userId, challengeId])

    // 只有第一次插入成功时才更新 solved_count
    if (insertRes.rowCount && insertRes.rowCount > 0) {
      await pool.query(`
        UPDATE challenges
        SET solved_count = solved_count + 1
        WHERE id = $1;
      `, [challengeId])
    }
  } catch (e) {
    console.error('记录解题信息失败', e)
  }
}
// 这里是一个示例的动态 flag 验证函数，可以根据你的实际情况修改
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validateDynamicFlag (flag: string, challengeId: string, userId: string) {
  // 假设你通过某些逻辑来动态验证 flag，比如调用外部 API 或计算值
  // 返回 true 表示验证成功，false 表示失败
  if (flag === 'dynamicflag_example') {
    return true
  } else {
    return false
  }
}

router.get('/by-category/:id', async (req, res) => {
  const categoryId = req.params.id

  // 查询该一级分类下所有的二级分类
  const subcategories = await pool.query(`
      SELECT sc.id, sc.name FROM subcategories sc
      WHERE sc.category_id = $1
    `, [categoryId])

  // 查询所有该一级分类下的题目，并按二级分类分组
  const challenges = await pool.query(`
      SELECT c.id, c.title, c.subcategory_id
      FROM challenges c
      WHERE c.category_id = $1
    `, [categoryId])

  const result = subcategories.rows.map(sub => ({
    ...sub,
    title: sub.name,
    children: challenges.rows.filter(c => c.subcategory_id === sub.id)
  }))

  res.json(result)
})

// 获取某个具体 challenge 的信息
router.get('/:id', async (req, res) => {
  const challengeId = req.params.id
  try {
    const result = await pool.query(
      `SELECT *
        FROM challenges c
        WHERE c.id = $1`,
      [challengeId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('查询题目信息失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 获取某个用户已经解过的 challenge
router.get('/solved/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const result = await pool.query(`
      SELECT challenge_id FROM solves WHERE user_id = $1
    `, [userId])

    res.json(result.rows.map(r => r.challenge_id))
  } catch (err) {
    console.error('获取已解题失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})
export default router