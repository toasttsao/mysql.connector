// src/db.js — MySQL connection pool
import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host:               process.env.MYSQL_HOST              ?? 'localhost',
    port:               parseInt(process.env.MYSQL_PORT     ?? '3306'),
    database:           process.env.MYSQL_DATABASE          ?? 'information_schema',
    user:               process.env.MYSQL_USER              ?? 'root',
    password:           process.env.MYSQL_PASSWORD          ?? '',
    connectTimeout:     parseInt(process.env.MYSQL_CONNECTION_TIMEOUT ?? '30000'),
    waitForConnections: true,
    connectionLimit:    5,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

/** @returns {Promise<mysql.PoolConnection>} */
export async function getConnection() {
    return pool.getConnection();
}

/**
 * 執行查詢並自動釋放連線
 * @param {string} sql
 * @param {any[]} [params]
 * @param {string} [database] — 若指定則先 USE database
 */
export async function query(sql, params = [], database = null) {
    const conn = await pool.getConnection();
    try {
        if (database) await conn.query(`USE \`${database}\``);
        const [rows] = await conn.query(sql, params);
        return rows;
    } finally {
        conn.release();
    }
}

export default pool;
