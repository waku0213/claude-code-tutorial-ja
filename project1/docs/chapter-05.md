# 第5章 — スラッシュコマンドとカスタマイズ

## この章でできるようになること

- 組み込みスラッシュコマンドを使いこなせる
- 繰り返し使う指示をカスタムスラッシュコマンドとして登録できる
- hooks を使って「Claude Code が何かをしたとき」に自動処理を走らせられる
- settings.json でパーミッションを適切にチューニングできる

---

## 5-1. 組み込みスラッシュコマンド

`/` から始まるコマンドは Claude Code の組み込み機能です。会話の中でいつでも使えます。

### よく使うコマンド一覧

| コマンド | 動作 |
|---|---|
| `/help` | 使えるコマンドの一覧を表示する |
| `/init` | CLAUDE.md を自動生成する |
| `/clear` | 会話履歴をリセットする（ファイルは消えない） |
| `/exit` | Claude Code を終了する |
| `/commit` | 変更をコミットする（メッセージも自動生成） |
| `/review` | 現在の差分をコードレビューする |
| `/compact` | 会話を圧縮して長いセッションを続けやすくする |
| `/status` | 現在の状態（変更ファイル、ブランチ等）を確認する |
| `/cost` | そのセッションのトークン使用量とコストを表示する |

### `/commit` — コミットを自動化する

```
> /commit
```

`git diff` を読んで適切なコミットメッセージを生成し、コミットまで完了します。
メッセージが気に入らなければ修正を頼めます：

```
> /commit
（生成されたメッセージ: "Add validation for todo title"）

> コミットメッセージを日本語にして
```

### `/review` — コミット前のレビュー

```
> /review
```

現在の差分（`git diff`）を読んでコードレビューをしてくれます。
レビュー観点を追加することもできます：

```
> /review セキュリティとパフォーマンスの観点で重点的に見て
```

### `/compact` — 長いセッションの管理

長時間作業していると会話が長くなり、Claude の応答が遅くなることがあります。

```
> /compact
```

これで会話を要約・圧縮しつつ、作業を継続できます。
1〜2時間以上の作業セッションでは定期的に使いましょう。

---

## 5-2. カスタムスラッシュコマンド

繰り返し使う指示パターンをコマンドとして登録できます。

### 作成場所

プロジェクト固有のコマンドは `.claude/commands/` ディレクトリに Markdown ファイルとして作ります。

```
todo-api/
├── .claude/
│   └── commands/
│       ├── check.md        → /check
│       ├── add-route.md    → /add-route
│       └── test-all.md     → /test-all
```

### 基本的な作り方

`.claude/commands/check.md` を作成：

```markdown
コードの品質チェックを行う。

以下の順番で確認して：
1. TypeScript のコンパイルエラー（npx tsc --noEmit）
2. テストの実行（npm test）
3. 型定義の甘さ（any の使用）
4. エラーハンドリングの漏れ

問題があれば修正して、最後に「チェック完了」と報告して。
```

使うときは：

```
> /check
```

これだけで毎回同じ品質チェックが走ります。

### 引数を使うカスタムコマンド

`$ARGUMENTS` を使うと実行時に値を渡せます。

`.claude/commands/add-route.md`：

```markdown
以下の仕様で新しいルートを src/routes/todos.ts に追加して。

ルート仕様: $ARGUMENTS

追加後に以下を確認して：
- TypeScript の型エラーがないこと
- 既存のテストが通ること
- 新しいエンドポイントのテストケースを列挙すること（実装は不要）
```

使うとき：

```
> /add-route GET /todos/:id/labels — 指定したTODOのラベル一覧を返す
```

### 実用的なカスタムコマンド例

**`/pr-ready`（プルリク前チェック）**

```markdown
プルリクエストを出す前の最終チェックを行う。

以下を順番に確認して：
1. npx tsc --noEmit でコンパイルエラーがないこと
2. npm test ですべてのテストが通ること
3. git diff main でレビュー観点（バグ・セキュリティ・型安全性）を確認
4. 変更内容を箇条書きでまとめてPRの説明文の草案を出す

問題があれば修正してから次のステップに進むこと。
```

**`/daily-start`（作業開始時のルーティン）**

```markdown
今日の作業を始める前に現状を把握する。

以下を確認して：
1. git status で未コミットの変更がないか
2. 現在のブランチ名
3. git log --oneline -5 で直近5件のコミット
4. src/ 以下を軽く読んで、前回の作業内容を要約する

確認後「準備完了です。何をしますか？」と聞いて。
```

---

## 5-3. hooks — イベントに応じた自動処理

hooks は「Claude Code が特定のアクションをしたとき」に自動でシェルコマンドを実行する仕組みです。

### hooks の種類

| フック名 | 実行タイミング |
|---|---|
| `PreToolUse` | Claude がツール（ファイル編集等）を使う直前 |
| `PostToolUse` | Claude がツールを使った直後 |
| `Notification` | Claude が通知を出したとき |
| `Stop` | Claude の応答が完了したとき |

### 設定ファイルの場所

プロジェクトの `.claude/settings.json` に書きます：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit 2>&1 | head -20"
          }
        ]
      }
    ]
  }
}
```

この設定では、Claude Code がファイルを書き換えるたびに TypeScript のコンパイルチェックが自動で走ります。

### 実用的な hooks 例

**ファイル保存のたびにテストを実行する**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test -- --passWithNoTests 2>&1 | tail -20"
          }
        ]
      }
    ]
  }
}
```

**作業完了時に通知を出す（macOS）**

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code が完了しました\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

**特定ファイルへの書き込みをブロックする**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo '$CLAUDE_TOOL_INPUT' | grep -q '.env' && echo 'Error: .env への書き込みは禁止' && exit 1 || exit 0"
          }
        ]
      }
    ]
  }
}
```

> **注意：** hooks は強力ですが、重いコマンドを設定するとすべての操作が遅くなります。
> テスト実行時間が長いプロジェクトでは頻度を調整しましょう。

---

## 5-4. settings.json — パーミッションのチューニング

Claude Code はデフォルトで「ファイルの変更前に確認を求める」設定になっています。
`settings.json` でこの動作を細かく調整できます。

### 設定ファイルの場所

| スコープ | ファイルの場所 | 適用範囲 |
|---|---|---|
| プロジェクト | `.claude/settings.json` | そのプロジェクトのみ |
| ユーザー | `~/.claude/settings.json` | すべてのプロジェクト |

### よく使う設定

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Bash(npx tsc*)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)"
    ],
    "deny": [
      "Bash(rm -rf*)",
      "Bash(git push*)"
    ]
  }
}
```

**`allow`：確認なしで実行を許可するコマンド**
毎回「実行してよいですか？」と聞かれるコマンドをここに入れると、自動で実行されます。

**`deny`：実行を禁止するコマンド**
事故を防ぎたいコマンドを明示的にブロックします。

### 推奨設定（開発中のプロジェクト向け）

```json
{
  "permissions": {
    "allow": [
      "Bash(npm*)",
      "Bash(npx*)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)"
    ],
    "deny": [
      "Bash(git push*)",
      "Bash(git reset --hard*)",
      "Bash(rm -rf*)"
    ]
  }
}
```

> **方針：** `allow` には「失敗してもすぐ気づける・取り消せるコマンド」だけ入れる。
> `push` や `reset --hard` など「取り消しにくい操作」は deny に入れておくのが安全です。

---

## よくあるつまずきポイント

### カスタムコマンドが認識されない

`.claude/commands/` のディレクトリ名とファイルが正しいか確認してください。
Claude Code の再起動が必要な場合もあります。

```bash
# ディレクトリ確認
ls .claude/commands/
```

### hooks が動かない

JSON の書き方を確認してください。構文エラーが最も多い原因です。

```bash
# JSON の構文チェック
cat .claude/settings.json | python3 -m json.tool
```

### パーミッションを allow にしたのに確認を求められる

glob パターンの書き方が合っていない可能性があります。

```json
// NG: 完全一致しか許可しない
"Bash(npm test)"

// OK: サブコマンドも含めて許可
"Bash(npm*)"
```

---

## 演習問題

### 演習 5-1（必須）：カスタムコマンドを作る

以下のカスタムコマンドを `.claude/commands/` に作成し、実際に動かしてみましょう：

1. `/check` — TypeScript コンパイルチェック + テスト実行をまとめて行う
2. `/summary` — 現在の src/ の構成とエンドポイント一覧を箇条書きで出力する

### 演習 5-2（必須）：settings.json を設定する

以下の要件を満たす `.claude/settings.json` を作成してください：

- `npm test` と `npx tsc --noEmit` は確認なしで実行できる
- `git push` は実行できないようにブロックする
- `rm -rf` もブロックする

### 演習 5-3（発展）：hooks を使う

ファイルが変更されるたびに `npx tsc --noEmit` が走る hook を設定して、
意図的に型エラーのあるコードを書き、hook がエラーを検知することを確認しましょう。

---

## まとめ

| 学んだこと | ポイント |
|---|---|
| 組み込みコマンド | `/commit`, `/review`, `/compact` を日常的に使う |
| カスタムコマンド | `.claude/commands/*.md` に書くだけで `/コマンド名` として使える |
| hooks | ファイル変更後の自動チェックに使う。重いコマンドは注意 |
| settings.json | `allow` で頻用コマンドを自動化、`deny` で事故防止 |

## 次の章へ

第6章では MCP（Model Context Protocol）を使って、Claude Code を GitHub や外部ツールと連携させる方法を学びます。

→ [第6章 — MCP（Model Context Protocol）連携](./chapter-06.md)
