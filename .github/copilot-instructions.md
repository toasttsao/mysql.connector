# Copilot Instructions — mcp-mysql

## Commands

```bash
npm start          # 啟動 MCP Server（stdio mode）
npm run dev        # 開發模式，檔案變更自動重啟
```

No test runner is configured. Verify changes by connecting via an MCP client (VS Code Copilot or Claude Desktop).

## Architecture

This is a **3-file MCP Server** that exposes MySQL as tools to AI assistants over stdio.

```
src/index.js   — MCP Server bootstrap: registers all tools, connects StdioServerTransport
src/tools.js   — Tool logic: each tool is an exported async function + a *Schema export
src/db.js      — mysql2/promise connection pool; exports query(sql, params, database)
```

**Data flow:** AI client → stdio → `index.js` (tool dispatch) → `tools.js` (business logic) → `db.js` (pool) → MySQL

## Key Conventions

### Adding a new tool
1. Add an exported async function + Schema object in `src/tools.js`
2. Import and register with `server.tool(name, description, zodSchema, handler)` in `src/index.js`
3. The handler must return `{ content: [{ type: 'text', text: string }] }`

### Tool schema pattern
Each tool has **two exports** in `tools.js`:
- `fooBarSchema` — raw JSON Schema object (kept for documentation/reference)
- `fooBar()` — the actual async implementation

`index.js` uses the Zod-based `server.tool()` API (not the raw schema), so Zod definitions live in `index.js`.

### Database switching
`db.query(sql, params, database)` accepts an optional `database` argument that issues `USE \`db\`` before the query on the same connection. Always use this instead of hardcoding `USE` in SQL strings.

### Parameterized queries
Always use `?` placeholders — never string interpolation. Pass values via the `params` array.

```js
// ✅ correct
query('SELECT * FROM users WHERE id = ?', [userId], 'mydb')

// ❌ never do this
query(`SELECT * FROM users WHERE id = ${userId}`)
```

### ES Modules
The project uses `"type": "module"` — all files use `import`/`export`. Do not use `require()`.

### Environment variables
All MySQL config comes from env vars prefixed `MYSQL_*`. Defaults are set in `db.js`. Copy `.env.example` to `.env` to configure locally — never commit `.env`.
