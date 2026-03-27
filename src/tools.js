// src/tools.js — MCP tool implementations for MySQL
import { query } from './db.js';

// ── execute_query ────────────────────────────────────────────────────────────
export const executeQuerySchema = {
    name: 'execute_query',
    description: '執行任意 MySQL SQL 語句（SELECT / INSERT / UPDATE / DELETE / DDL），支援 ? 佔位參數化查詢防止 SQL Injection',
    inputSchema: {
        type: 'object',
        properties: {
            sql: {
                type: 'string',
                description: '要執行的 SQL 語句，參數位置用 ? 佔位',
            },
            params: {
                type: 'array',
                description: '對應 ? 的參數值陣列（可省略）',
                items: {},
            },
            database: {
                type: 'string',
                description: '指定要切換的資料庫名稱（可省略，省略則使用連線預設）',
            },
        },
        required: ['sql'],
    },
};

export async function executeQuery({ sql, params = [], database = null }) {
    const rows = await query(sql, params, database);
    return JSON.stringify(rows, null, 2);
}

// ── list_databases ───────────────────────────────────────────────────────────
export const listDatabasesSchema = {
    name: 'list_databases',
    description: '列出 MySQL 伺服器上所有可存取的資料庫',
    inputSchema: {
        type: 'object',
        properties: {},
    },
};

export async function listDatabases() {
    const rows = await query('SHOW DATABASES');
    const names = rows.map(r => Object.values(r)[0]);
    return names.join('\n');
}

// ── list_tables ──────────────────────────────────────────────────────────────
export const listTablesSchema = {
    name: 'list_tables',
    description: '列出指定資料庫的所有資料表，可選擇是否包含 View',
    inputSchema: {
        type: 'object',
        properties: {
            database: {
                type: 'string',
                description: '資料庫名稱',
            },
            include_views: {
                type: 'boolean',
                description: '是否包含 VIEW（預設 false）',
            },
        },
        required: ['database'],
    },
};

export async function listTables({ database, include_views = false }) {
    const typeFilter = include_views ? '' : "AND TABLE_TYPE = 'BASE TABLE'";
    const rows = await query(
        `SELECT TABLE_NAME, TABLE_TYPE, TABLE_ROWS, CREATE_TIME
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? ${typeFilter}
         ORDER BY TABLE_TYPE, TABLE_NAME`,
        [database]
    );
    return JSON.stringify(rows, null, 2);
}

// ── describe_table ───────────────────────────────────────────────────────────
export const describeTableSchema = {
    name: 'describe_table',
    description: '取得資料表的欄位定義、型別、是否可 NULL、預設值與主鍵資訊',
    inputSchema: {
        type: 'object',
        properties: {
            database: { type: 'string', description: '資料庫名稱' },
            table:    { type: 'string', description: '資料表名稱' },
        },
        required: ['database', 'table'],
    },
};

export async function describeTable({ database, table }) {
    const columns = await query(
        `SELECT
            COLUMN_NAME        AS \`column\`,
            COLUMN_TYPE        AS type,
            IS_NULLABLE        AS nullable,
            COLUMN_DEFAULT     AS \`default\`,
            EXTRA,
            COLUMN_KEY         AS key_type,
            COLUMN_COMMENT     AS comment
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [database, table]
    );
    return JSON.stringify(columns, null, 2);
}

// ── list_stored_procedures ───────────────────────────────────────────────────
export const listStoredProceduresSchema = {
    name: 'list_stored_procedures',
    description: '列出指定資料庫的預存程序，支援關鍵字模糊搜尋',
    inputSchema: {
        type: 'object',
        properties: {
            database: { type: 'string', description: '資料庫名稱' },
            keyword:  { type: 'string', description: '名稱模糊搜尋關鍵字（可省略）' },
        },
        required: ['database'],
    },
};

export async function listStoredProcedures({ database, keyword = '' }) {
    const like = `%${keyword}%`;
    const rows = await query(
        `SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED, LAST_ALTERED
         FROM information_schema.ROUTINES
         WHERE ROUTINE_SCHEMA = ?
           AND ROUTINE_TYPE IN ('PROCEDURE', 'FUNCTION')
           AND ROUTINE_NAME LIKE ?
         ORDER BY ROUTINE_TYPE, ROUTINE_NAME`,
        [database, like]
    );
    return JSON.stringify(rows, null, 2);
}

// ── get_stored_procedure_definition ─────────────────────────────────────────
export const getStoredProcedureDefinitionSchema = {
    name: 'get_stored_procedure_definition',
    description: '取得指定預存程序或函式的完整 SQL 定義',
    inputSchema: {
        type: 'object',
        properties: {
            database: { type: 'string', description: '資料庫名稱' },
            name:     { type: 'string', description: '預存程序或函式名稱' },
        },
        required: ['database', 'name'],
    },
};

export async function getStoredProcedureDefinition({ database, name }) {
    const rows = await query(
        `SELECT ROUTINE_TYPE, ROUTINE_DEFINITION
         FROM information_schema.ROUTINES
         WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = ?`,
        [database, name]
    );
    if (!rows.length) return `找不到 ${name}`;
    const { ROUTINE_TYPE, ROUTINE_DEFINITION } = rows[0];
    return `-- ${ROUTINE_TYPE}: ${name}\n${ROUTINE_DEFINITION}`;
}

// ── list_indexes ─────────────────────────────────────────────────────────────
export const listIndexesSchema = {
    name: 'list_indexes',
    description: '列出資料表的所有索引，包含主鍵與唯一索引',
    inputSchema: {
        type: 'object',
        properties: {
            database: { type: 'string', description: '資料庫名稱' },
            table:    { type: 'string', description: '資料表名稱' },
        },
        required: ['database', 'table'],
    },
};

export async function listIndexes({ database, table }) {
    const rows = await query(
        `SELECT
            INDEX_NAME,
            NON_UNIQUE,
            SEQ_IN_INDEX,
            COLUMN_NAME,
            INDEX_TYPE,
            NULLABLE
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [database, table]
    );
    return JSON.stringify(rows, null, 2);
}
