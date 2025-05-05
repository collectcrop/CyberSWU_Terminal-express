// run this once to insert a test user
import bcrypt from 'bcrypt'
import pool from './config/db'

async function insertTestUser () {
  const passwordHash = await bcrypt.hash('mypassword123', 10)
  await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', passwordHash])
  console.log('Test user inserted')
}
insertTestUser ()
