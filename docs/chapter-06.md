# 第6章 — MCP（Model Context Protocol）連携

## この章でできるようになること

- MCP が何のための仕組みかを説明できる
- GitHub・ファイルシステムなど主要な MCP サーバーを Claude Code に接続できる
- 独自 MCP サーバーの作り方の概要を理解する

---

## 6-1. MCP とは何か

### 一言でいうと

**Claude Code が「外のツール」を使えるようにする拡張機構** です。

デフォルトの Claude Code はプロジェクトのファイルとターミナルを操作できます。
MCP を使うと、以下のような外部ツールも直接操作できるようになります：

- GitHub（Issue・PR の読み書き）
- データベース（クエリを投げてデータを読む）
- Slack（メッセージの送受信）
- ブラウザ（ページのスクレイピングや操作）
- 社内 API（カスタム MCP で接続）

### 仕組みのイメージ

```
Claude Code
    │
    ├── ファイル操作（標準機能）
    ├── ターミナル実行（標準機能）
    │
    ├── GitHub MCP サーバー ──→ GitHub API
    ├── SQLite MCP サーバー ──→ データベースファイル
    └── カスタム MCP サーバー ──→ 社内システム
```

MCP サーバーは Claude Code と外部ツールの間の「通訳」です。
Claude Code は MCP サーバーを通じて外部ツールを自然言語で操作できます。

### MCP がない世界との比較

| やりたいこと | MCP なし | MCP あり |
|---|---|---|
| GitHub Issue を読む | ブラウザで開いてコピペ | 「Issue #42 を読んで」と指示するだけ |
| DB の内容を確認 | ターミナルでクエリを手打ち | 「todos テーブルの中身を教えて」と指示するだけ |
| PR にコメント | ブラウザで入力 | 「このレビューコメントを PR に投稿して」と指示するだけ |

---

## 6-2. MCP サーバーの設定方法

設定は `~/.claude/settings.json`（全プロジェクト共通）または `.claude/settings.json`（プロジェクト固有）に書きます。

### 基本的な設定形式

```json
{
  "mcpServers": {
    "サーバー名": {
      "command": "起動コマンド",
      "args": ["引数1", "引数2"],
      "env": {
        "環境変数名": "値"
      }
    }
  }
}
```

---

## 6-3. よく使われる MCP サーバー

### GitHub MCP

Issue・PR・コードの検索など GitHub の操作が自然言語でできます。

**インストール：**

```bash
npm install -g @modelcontextprotocol/server-github
```

**設定（`~/.claude/settings.json`）：**

```json
{
  "mcpServers": {
    "github": {
      "command": "mcp-server-github",
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

**使い方：**

```
> GitHub の issue #42 を読んで、対応方法を提案して

> 現在の変更で PR を作って。タイトルと説明文も生成して

> このリポジトリの open な Issue を一覧にして、優先度の高そうなものを教えて
```

### ファイルシステム MCP

プロジェクト外のディレクトリも操作できます。

**インストール：**

```bash
npm install -g @modelcontextprotocol/server-filesystem
```

**設定：**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/Users/yourname/documents", "/Users/yourname/desktop"]
    }
  }
}
```

**使い方：**

```
> ~/documents/仕様書.md を読んで、この仕様を todo-api に実装して
```

### SQLite MCP

SQLite データベースをクエリできます。todo-api を DB 対応させたときに特に便利です。

**インストール：**

```bash
npm install -g @modelcontextprotocol/server-sqlite
```

**設定：**

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "mcp-server-sqlite",
      "args": ["--db-path", "./todo.db"]
    }
  }
}
```

**使い方：**

```
> todos テーブルの中身を確認して

> done が true の TODO が何件あるか教えて

> テストデータを10件 INSERT して
```

### Brave Search MCP

Web 検索ができます。ライブラリのドキュメントを調べながら実装するときに便利です。

**インストール：**

```bash
npm install -g @modelcontextprotocol/server-brave-search
```

**設定：**

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "mcp-server-brave-search",
      "env": {
        "BRAVE_API_KEY": "BSAxxxxxxxx"
      }
    }
  }
}
```

**使い方：**

```
> Express 5 の breaking changes を調べて、このプロジェクトへの影響を教えて
```

---

## 6-4. MCP の接続確認

設定後、Claude Code を起動して接続を確認します：

```
> /mcp
```

接続中の MCP サーバーの一覧と状態が表示されます。

```
Connected MCP Servers:
  ✓ github     (12 tools available)
  ✓ sqlite     (5 tools available)
  ✗ filesystem (connection failed)
```

失敗しているサーバーがあれば、コマンドパスや環境変数を確認してください。

---

## 6-5. 独自 MCP サーバーを作る

社内システムや独自 API を Claude Code から操作したい場合、MCP サーバーを自作できます。

### 構造の概要

MCP サーバーは「Claude Code からのリクエストを受け取り、外部ツールを操作して結果を返す」プログラムです。
TypeScript で書くのが最も一般的です。

**最小構成（`my-mcp-server/src/index.ts`）：**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-company-api", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 使えるツールの一覧を定義する
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_project_info",
      description: "社内プロジェクト管理システムからプロジェクト情報を取得する",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "プロジェクトID" },
        },
        required: ["project_id"],
      },
    },
  ],
}));

// ツールが呼ばれたときの処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_project_info") {
    const { project_id } = request.params.arguments as { project_id: string };

    // 実際には社内 API を叩く処理を書く
    const projectInfo = await fetchProjectFromInternalAPI(project_id);

    return {
      content: [{ type: "text", text: JSON.stringify(projectInfo, null, 2) }],
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function fetchProjectFromInternalAPI(id: string) {
  // 社内 API へのリクエスト（例）
  const res = await fetch(`https://internal.example.com/projects/${id}`);
  return res.json();
}

// 起動
const transport = new StdioServerTransport();
await server.connect(transport);
```

**設定への追加：**

```json
{
  "mcpServers": {
    "my-company-api": {
      "command": "node",
      "args": ["./my-mcp-server/dist/index.js"]
    }
  }
}
```

**使い方：**

```
> プロジェクト P-1234 の情報を取得して、このコードに反映すべき仕様を教えて
```

### SIer での活用イメージ

SIer の現場では以下のような MCP サーバーが特に役立ちます：

- **仕様書 MCP**：社内 Wiki や Confluence から仕様書を読んで実装に反映する
- **チケット MCP**：Redmine や Backlog からタスク情報を取得して作業を始める
- **テスト環境 MCP**：テスト環境の DB やログにアクセスしてデバッグする
- **コード規約チェック MCP**：社内のコーディング規約をチェックする独自ツールを繋ぐ

---

## よくあるつまずきポイント

### MCP サーバーが起動しない

コマンドがインストールされているか確認してください：

```bash
which mcp-server-github
# not found の場合はインストールが必要
npm install -g @modelcontextprotocol/server-github
```

### 認証エラーが出る

トークンや API キーの設定を確認してください。
`.env` ファイルから読み込む場合は `env` フィールドに展開した値を書く必要があります。

```json
// NG: .env の変数名をそのまま書いても展開されない
"env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN" }

// OK: 実際の値を書く（またはシェルで展開する）
"env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_実際のトークン" }
```

### MCP ツールが使われない

Claude Code は必要と判断したときだけ MCP ツールを使います。
明示的に使ってほしいときは指示に含めましょう：

```
> GitHub MCP を使って Issue #42 を読んで
```

---

## 演習問題

### 演習 6-1（必須）：GitHub MCP を接続する

1. GitHub の Personal Access Token を発行する（`repo` スコープが必要）
2. `~/.claude/settings.json` に GitHub MCP の設定を追加する
3. Claude Code を起動して `/mcp` で接続を確認する
4. 自分のリポジトリの Issue 一覧を取得してみる

### 演習 6-2（必須）：SQLite MCP を使う

1. todo-api に SQLite を追加して `todo.db` を作成する（第3章の演習か Claude Code に頼む）
2. SQLite MCP を設定する
3. 「todos テーブルの全件を取得して」と指示して動作確認する

### 演習 6-3（発展）：カスタム MCP サーバーの設計

実際に作らなくてよいので、自分の将来の職場（SIer）で「あったら便利な MCP サーバー」を1つ設計してみましょう。

- サーバー名
- 提供するツール（関数）の一覧
- 入力と出力の形式
- どの外部システムと繋ぐか

---

## まとめ

| 学んだこと | ポイント |
|---|---|
| MCP の役割 | Claude Code と外部ツールをつなぐ「通訳」|
| 設定方法 | `settings.json` の `mcpServers` に書く |
| 主要サーバー | GitHub・SQLite・ファイルシステム・Brave Search |
| 独自サーバー | TypeScript + MCP SDK で作れる。社内ツールとの連携に活用 |

## 次の章へ

第7章ではチームや本番プロジェクトで Claude Code を運用するための知識を学びます。
CLAUDE.md の育て方・セキュリティ・CI/CD 連携・コスト管理を解説します。

→ [第7章 — チーム・プロジェクトでの運用](./chapter-07.md)
