# 第1章 — セットアップと最初の一歩

## この章でできるようになること

- Claude Code をインストールして認証を完了できる
- TypeScript プロジェクトに Claude Code を導入し、最初の会話ができる
- `CLAUDE.md` の役割を理解し、自分のプロジェクト用に書ける

---

## 1-1. Claude Code とは何か

### Web 版との決定的な違い

ブラウザで使う Claude（claude.ai）は「コードを貼り付けて相談する」ツールです。
一方 Claude Code は **あなたのプロジェクトの中に直接入り込む** ツールです。

| | claude.ai（Web版） | Claude Code |
|---|---|---|
| ファイルの読み書き | コピペが必要 | 直接読み書きできる |
| コマンド実行 | できない | ターミナルコマンドを実行できる |
| git との連携 | できない | `git diff` を読んでコミットまで作れる |
| 作業の文脈 | 毎回リセット | プロジェクト全体を把握した状態で会話できる |

**具体的なイメージ：**
```
# Web版でやっていたこと
1. ファイルを開く
2. 該当コードをコピー
3. ブラウザに貼り付けて質問
4. 返ってきたコードをコピー
5. エディタに貼り付けて保存

# Claude Code でやること
1. ターミナルで「このバグを直して」と打つ
2. 終わり（ファイルは自動で書き換わっている）
```

### なぜ SIer でも役に立つのか

SIer の現場では「既存コードの読解」「仕様書からの実装」「テスト作成」「ドキュメント整備」といった作業が多くあります。
Claude Code はこれらをすべてターミナル上から指示できるため、日常の開発サイクルに自然に組み込めます。

---

## 1-2. インストール

### 前提条件の確認

```bash
# Node.js 18 以上が必要
node --version
# v18.0.0 以上であればOK

# npm も確認
npm --version
```

Node.js が入っていない場合は [nodejs.org](https://nodejs.org/) から LTS 版をインストールしてください。

### Claude Code 本体のインストール

```bash
npm install -g @anthropic-ai/claude-code
```

インストールが完了したら起動確認：

```bash
claude --version
```

バージョン番号が表示されれば成功です。

---

## 1-3. 認証

Claude Code を使うには Anthropic のアカウントが必要です。

```bash
claude
```

初回起動時にブラウザが開き、Anthropic のログイン画面が表示されます。
ログインするとターミナルに戻り、会話が始められる状態になります。

```
✓ Logged in as your@email.com
> 
```

> **補足：** 認証情報はローカルに保存されるため、次回以降は `claude` を打つだけで即使えます。

---

## 1-4. 最初のプロジェクトを作る

この章から全章を通じて使うサンプルプロジェクト（TypeScript + Express の TODO API）を準備します。

### プロジェクトの雛形を作る

```bash
mkdir todo-api
cd todo-api
npm init -y
npm install express
npm install -D typescript @types/express @types/node ts-node
npx tsc --init
```

`src/index.ts` を作成して最小限のサーバーを書きます：

```typescript
// src/index.ts
import express from "express";

const app = express();
app.use(express.json());

const todos: { id: number; title: string; done: boolean }[] = [];
let nextId = 1;

app.get("/todos", (_req, res) => {
  res.json(todos);
});

app.post("/todos", (req, res) => {
  const { title } = req.body;
  const todo = { id: nextId++, title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Claude Code をプロジェクトに導入する

プロジェクトディレクトリの中で Claude Code を起動します。

```bash
# todo-api ディレクトリの中にいることを確認
cd todo-api
claude
```

起動したらまず全体像を把握させます：

```
> このプロジェクトの構成を教えて
```

Claude Code はディレクトリ内のファイルを読み、構成を説明してくれます。

---

## 1-5. CLAUDE.md — プロジェクトの「説明書」

### CLAUDE.md とは

Claude Code が起動するたびに **自動的に読み込まれる** Markdown ファイルです。
ここに書いたことは、毎回伝え直さなくても Claude が知っている状態になります。

**書くべき内容：**
- プロジェクトの目的と概要
- 使用技術・バージョン
- よく使うコマンド
- コーディング規約
- 触ってはいけないファイルや注意事項

### `/init` で自動生成する

Claude Code には CLAUDE.md の雛形を自動で作るコマンドがあります：

```
> /init
```

プロジェクトを解析して CLAUDE.md を生成してくれます。
生成されたファイルをそのまま使ってもよいですが、以下のように**手動で育てる**ことが重要です。

### todo-api 用の CLAUDE.md 例

```markdown
# CLAUDE.md

## プロジェクト概要
TypeScript + Express で作った TODO 管理 REST API。
Claude Code チュートリアルのサンプルプロジェクト。

## 技術スタック
- Node.js 20
- TypeScript 5
- Express 4

## よく使うコマンド
\`\`\`bash
npm run dev      # 開発サーバー起動（ts-node）
npm run build    # TypeScript のビルド
npm test         # テスト実行
\`\`\`

## ディレクトリ構成
- src/index.ts   エントリーポイント
- src/routes/    ルーティング
- src/types/     型定義

## コーディング規約
- 型は明示的に書く（any 禁止）
- エラーハンドリングは必ず入れる
- コメントは日本語でOK
```

> **ポイント：** CLAUDE.md は育てるものです。「Claude に毎回同じことを説明している」と気づいたら、その内容を CLAUDE.md に追記しましょう。

---

## 1-6. 最初の会話を体験する

ここからは実際に Claude Code と会話します。

### コードを読んでもらう

```
> src/index.ts を読んで、このAPIでできることを箇条書きで教えて
```

### 簡単な機能追加を頼む

```
> DELETE /todos/:id エンドポイントを追加して
```

Claude Code はコードを書いてファイルを直接更新します。
変更前に「こういう変更をしますがよいですか？」と確認を求めてくる場合は `y` で承認します。

### 動作確認

```bash
# 別のターミナルでサーバーを起動
npx ts-node src/index.ts

# TODO を追加
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Claude Code を覚える"}'

# 一覧を取得
curl http://localhost:3000/todos
```

---

## よくあるつまずきポイント

### `claude` コマンドが見つからない

```bash
# グローバルインストールのパスが通っていない可能性
npm config get prefix
# 表示されたパス/bin を PATH に追加する
```

### 認証がループする

一度ログアウトして再認証してみてください：

```bash
claude logout
claude
```

### Claude Code が勝手にファイルを書き換えるのが怖い

デフォルトでは変更前に確認を求めます。確認なしに変更されることはありません。
また、プロジェクトが git 管理下にあれば `git diff` でいつでも変更を確認・取り消しできます。

```bash
# 変更を確認
git diff

# 全変更を取り消す
git checkout .
```

> **習慣にすること：** Claude Code を使う前に `git commit` しておく。これだけで「壊れても戻せる」安心感が生まれます。

---

## 演習問題

### 演習 1-1（必須）：環境構築

1. Node.js と Claude Code をインストールする
2. `todo-api` プロジェクトを作成し、`src/index.ts` を書く
3. `claude` を起動し、「このプロジェクトの概要を教えて」と聞く

### 演習 1-2（必須）：CLAUDE.md を作る

1. `/init` で CLAUDE.md を自動生成する
2. 生成された内容を読んで、不足している情報を3つ以上追記する
3. Claude Code を再起動し、「このプロジェクトのコーディング規約は？」と聞いて CLAUDE.md の内容が反映されているか確認する

### 演習 1-3（発展）：最初の機能追加

`PATCH /todos/:id` エンドポイント（タイトルの更新と完了フラグの切り替えができる）を Claude Code に追加してもらいましょう。
その際、以下を意識してください：

- 変更内容を承認する前に、コードをきちんと読む
- 追加後に `curl` で動作確認する
- `git diff` で変更箇所を把握する

---

## まとめ

| 学んだこと | ポイント |
|---|---|
| Claude Code の位置づけ | ファイルを直接読み書きできる「プロジェクト内の Claude」|
| インストール | `npm install -g @anthropic-ai/claude-code` |
| 起動と認証 | `claude` を打てば OK、初回のみブラウザ認証 |
| CLAUDE.md | 毎回伝え直すことを書いておく「プロジェクトの説明書」|
| 安全に使うコツ | 作業前に `git commit` しておけば怖くない |

## 次の章へ

第2章では Claude Code の基本操作（ファイルの渡し方、変更の取り消し方など）を体系的に学びます。
「なんとなく動かせる」から「意図通りに動かせる」へステップアップしましょう。

→ [第2章 — 基本的な使い方](./chapter-02.md)
