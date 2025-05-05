// index.js
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import challengesRoutes from './routes/challenges.js'
import userRoutes from './routes/user.js'
import categoriesRoutes from './routes/categories.js'
import 'env.js'
const app = express()

// // 启用 CORS 支持
app.use(cors())
app.use(express.json())


app.use('/api/auth', authRoutes)
app.use('/api/challenges', challengesRoutes)
app.use('/api/user', userRoutes)
app.use('/api/categories', categoriesRoutes)
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})