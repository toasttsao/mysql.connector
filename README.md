# mcp-mysql

> 讓 AI 助理（GitHub Copilot CLI / Claude Desktop）直接對話 MySQL 的 MCP Server

Node.js 實作的 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) Server，串接 MySQL，讓你透過 AI 助理用自然語言查詢資料、檢視表結構、閱讀預存程序，不再需要手動寫 SQL。

---

## 🚀 快速開始

### 前置需求

- Node.js **18+**
- 可連線的 MySQL 執行個體（本機或遠端均可）

### 1. Clone 並安裝相依套件

```bash
git clone <此 repo URL>
cd mysql.connector
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

開啟 `.env`，填入你的 MySQL 連線資訊：

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=your_database
MYSQL_USER=root
MYSQL_PASSWORD=your_password
```

### 3. 本機測試啟動

```bash
npm start
# 或開發模式（檔案變更自動重啟）
npm run dev
```

啟動成功後會看到：

```
mcp-mysql server 已啟動
連線目標: localhost:3306
```

---

## 🔌 整合到 AI 工具

### GitHub Copilot CLI（VS Code）

編輯 VS Code 的 MCP 設定（`.vscode/mcp.json`）：

```json
{
  "servers": {
    "mysql": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/<你的帳號>/IdeaProjects/mysql.connector/src/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password"
      }
    }
  }
}
```

### Claude Desktop

編輯 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/Users/<你的帳號>/IdeaProjects/mysql.connector/src/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password"
      }
    }
  }
}
```

> ⚠️ 路徑請改為你本機實際的絕對路徑。

---

## 💬 使用範例

### 查詢資料

```
幫我查 orders 前 10 筆資料
```

```
列出 status 不是 1 的所有記錄，只要 id、user_id、created_at
```

```
查詢今天新增的訂單，依建立時間降冪排列
```

### 探索資料庫結構

```
這個資料庫裡有哪些 Table？
```

```
幫我看一下 users 的欄位結構
```

```
有沒有跟 payment 有關的預存程序？
```

### 讀取預存程序

```
把 sp_get_user_orders 的定義給我看
```

### 參數化查詢（防 SQL Injection）

當 AI 助理呼叫 `execute_query` 時，可傳入 `params` 欄位：

```json
{
  "sql": "SELECT * FROM users WHERE id = ? AND name = ?",
  "params": [42, "Alice"],
  "database": "mydb"
}
```

---

## 🛠️ 可用工具（Tools）

| 工具名稱 | 說明 |
|---|---|
| `execute_query` | 執行任意 SQL（SELECT / INSERT / UPDATE / DELETE / DDL），支援 `?` 佔位參數化查詢防 Injection |
| `list_databases` | 列出伺服器上所有可存取的資料庫 |
| `list_tables` | 列出指定資料庫的所有資料表（可選擇包含 View） |
| `describe_table` | 取得資料表欄位定義、型別、是否可 NULL、主鍵資訊 |
| `list_stored_procedures` | 列出預存程序，支援關鍵字模糊搜尋 |
| `get_stored_procedure_definition` | 取得預存程序或函式的完整 SQL 定義 |
| `list_indexes` | 列出資料表的所有索引（含主鍵、唯一索引） |

---

## ⚙️ 環境變數一覽

| 變數名稱 | 預設值 | 說明 |
|---|---|---|
| `MYSQL_HOST` | `localhost` | MySQL 主機位址 |
| `MYSQL_PORT` | `3306` | 連接埠 |
| `MYSQL_DATABASE` | `information_schema` | 預設資料庫 |
| `MYSQL_USER` | `root` | 登入帳號 |
| `MYSQL_PASSWORD` | _(空)_ | 登入密碼 |
| `MYSQL_SSL` | `false` | `true` 啟用 SSL（遠端 / 雲端 MySQL） |
| `MYSQL_CONNECTION_TIMEOUT` | `30000` | 連線逾時（毫秒） |

---

## 📁 專案結構

```
mysql.connector/
├── src/
│   ├── index.js      # MCP Server 入口、工具註冊
│   ├── db.js         # MySQL 連線池管理（mysql2/promise）
│   └── tools.js      # 各工具實作
├── .env.example      # 環境變數範本（請複製為 .env）
├── .gitignore
├── package.json
└── README.md
```
