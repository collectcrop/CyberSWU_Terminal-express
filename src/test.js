// run this once to insert a test user
const bcrypt = require('bcrypt');
const pool = require('./config/db');

async function insertTestUser() {
  const passwordHash = await bcrypt.hash('mypassword123', 10);
  await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', passwordHash]);
  console.log('Test user inserted');
}
insertTestUser();
