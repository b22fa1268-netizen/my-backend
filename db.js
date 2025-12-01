const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  host: process.env.HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === "production" 
       ? { rejectUnauthorized: false }  
       : false                           
});

async function connectDB() {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected");
    client.release();
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
}

module.exports = { pool, connectDB };
