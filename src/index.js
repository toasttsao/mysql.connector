// src/index.js — MCP Server entry point for MySQL
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
    executeQuery,
    listDatabases,
    listTables,
    describeTable,
    listStoredProcedures,
    getStoredProcedureDefinition,
    listIndexes,
} from './tools.js';

const server = new McpServer({
    name: 'mysql-connector',
    version: '1.0.0',
});

// ── execute_query ────────────────────────────────────────────────────────────
server.tool(
    'execute_query',
    '執行任意 MySQL SQL 語句（SELECT / INSERT / UPDATE / DELETE / DDL），支援 ? 佔位參數化查詢防止 SQL Injection',
    {
        sql:      z.string().describe('要執行的 SQL 語句，參數位置用 ? 佔位'),
        params:   z.array(z.any()).optional().describe('對應 ? 的參數值陣列（可省略）'),
        database: z.string().optional().describe('指定要切換的資料庫名稱（可省略）'),
    },
    async ({ sql, params, database }) => ({
        content: [{ type: 'text', text: await executeQuery({ sql, params, database }) }],
    })
);

// ── list_databases ───────────────────────────────────────────────────────────
server.tool(
    'list_databases',
    '列出 MySQL 伺服器上所有可存取的資料庫',
    {},
    async () => ({
        content: [{ type: 'text', text: await listDatabases() }],
    })
);

// ── list_tables ──────────────────────────────────────────────────────────────
server.tool(
    'list_tables',
    '列出指定資料庫的所有資料表，可選擇是否包含 View',
    {
        database:      z.string().describe('資料庫名稱'),
        include_views: z.boolean().optional().describe('是否包含 VIEW（預設 false）'),
    },
    async ({ database, include_views }) => ({
        content: [{ type: 'text', text: await listTables({ database, include_views }) }],
    })
);

// ── describe_table ───────────────────────────────────────────────────────────
server.tool(
    'describe_table',
    '取得資料表的欄位定義、型別、是否可 NULL、預設值與主鍵資訊',
    {
        database: z.string().describe('資料庫名稱'),
        table:    z.string().describe('資料表名稱'),
    },
    async ({ database, table }) => ({
        content: [{ type: 'text', text: await describeTable({ database, table }) }],
    })
);

// ── list_stored_procedures ───────────────────────────────────────────────────
server.tool(
    'list_stored_procedures',
    '列出指定資料庫的預存程序，支援關鍵字模糊搜尋',
    {
        database: z.string().describe('資料庫名稱'),
        keyword:  z.string().optional().describe('名稱模糊搜尋關鍵字（可省略）'),
    },
    async ({ database, keyword }) => ({
        content: [{ type: 'text', text: await listStoredProcedures({ database, keyword }) }],
    })
);

// ── get_stored_procedure_definition ─────────────────────────────────────────
server.tool(
    'get_stored_procedure_definition',
    '取得指定預存程序或函式的完整 SQL 定義',
    {
        database: z.string().describe('資料庫名稱'),
        name:     z.string().describe('預存程序或函式名稱'),
    },
    async ({ database, name }) => ({
        content: [{ type: 'text', text: await getStoredProcedureDefinition({ database, name }) }],
    })
);

// ── list_indexes ─────────────────────────────────────────────────────────────
server.tool(
    'list_indexes',
    '列出資料表的所有索引，包含主鍵與唯一索引',
    {
        database: z.string().describe('資料庫名稱'),
        table:    z.string().describe('資料表名稱'),
    },
    async ({ database, table }) => ({
        content: [{ type: 'text', text: await listIndexes({ database, table }) }],
    })
);

// ── 啟動 ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`mcp-mysql server 已啟動`);
console.error(`連線目標: ${process.env.MYSQL_HOST ?? 'localhost'}:${process.env.MYSQL_PORT ?? '3306'}`);
