import mysql from 'mysql2/promise';
import fs from 'fs';

const poolConfig = {
    user: process.env.DB_USER || 'ponp9455_bpi',
    password: process.env.DB_PASSWORD || 'BNQK*v(~jW!h(@$V',
    database: process.env.DB_NAME || 'ponp9455_bpi',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// Automagically detect aaPanel socket if not in env
const defaultSocket = '/tmp/mysql.sock';
const socketPath = process.env.DB_SOCKET || (fs.existsSync(defaultSocket) ? defaultSocket : null);

if (socketPath) {
    poolConfig.socketPath = socketPath;
    console.log(`> DB Pool: Initializing with Unix Socket: ${socketPath}`);
} else {
    poolConfig.host = process.env.DB_HOST || '127.0.0.1';
    console.log(`> DB Pool: Initializing with Host: ${poolConfig.host}`);
}

let pool;
try {
    pool = mysql.createPool(poolConfig);
    console.log('> DB Pool: Created successfully');
} catch (err) {
    console.error('> DB Pool: CRITICAL INITIALIZATION ERROR:', err);
}

export default pool;
