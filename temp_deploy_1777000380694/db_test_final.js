const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  console.log('Testing connection with:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('DB:', process.env.DB_NAME);
  console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

  try {
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };

    if (process.env.DB_SOCKET) {
      config.socketPath = process.env.DB_SOCKET;
      console.log('Using Socket:', config.socketPath);
    } else {
      config.host = process.env.DB_HOST || 'localhost';
      console.log('Using Host:', config.host);
    }

    const connection = await mysql.createConnection(config);
    console.log('SUCCESS: Connected to database');
    const [rows] = await connection.execute('SELECT 1 as ok');
    console.log('Query result:', rows);
    await connection.end();
  } catch (err) {
    console.error('FAILURE: Connection failed');
    console.error(err);
  }
}

test();
