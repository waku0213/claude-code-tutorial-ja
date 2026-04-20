# 第7章 — チーム・プロジェクトでの運用

## この章でできるようになること

- CLAUDE.md をチームの共有資産として育てられる
- セキュリティリスクを理解して安全に運用できる
- CI/CD パイプラインに Claude Code を組み込める
- コストを把握して無駄な消費を防げる

---

## 7-1. CLAUDE.md をチームで育てる

### CLAUDE.md はチームの「オンボーディング資料」

個人プロジェクトでは「自分が毎回伝え直さないための資料」でしたが、
チームでは **新メンバーが初日から迷わないための資料** にもなります。

CLAUDE.md がよく整備されたプロジェクトでは：
- 新人が「このプロジェクトの規約は？」と Claude Code に聞けば答えが返ってくる
- 「なぜそういうコーディング規約なのか」の理由も書いておくと、Claude Code が文脈を理解した上で実装してくれる

### チーム向け CLAUDE.md の書き方

個人用に加えて以下を書きます：

```markdown
# CLAUDE.md

## プロジェクト概要
（省略）

## チーム開発のルール

### ブランチ戦略
- main ブランチへの直接 push 禁止
- 機能追加: feature/xxxx
- バグ修正: fix/xxxx
- PR はレビュー1名以上の承認が必要

### コミットメッセージ規約
- feat: 新機能
- fix: バグ修正
- refactor: リファクタリング
- test: テスト追加・修正
- docs: ドキュメント

### レビュー観点
- 型安全性（any 禁止）
- エラーハンドリングの網羅
- テストの追加
- CLAUDE.md との整合性

## やってはいけないこと
- .env の内容をコードにハードコードしない
- git push --force を使わない
- npm audit で High 以上の脆弱性があるパッケージを追加しない
```

### git で CLAUDE.md を管理する

CLAUDE.md はコードと同じリポジトリに入れて git 管理します。
「誰かが CLAUDE.md を更新したらレビューが必要」というルールを設けると品質が保てます。

```bash
# CLAUDE.md の変更履歴を確認する
git log --oneline CLAUDE.md

# 最新の変更を確認する
git diff HEAD~1 CLAUDE.md
```

### CLAUDE.md の更新タイミング

- **バグを直したとき** → 「このミスをしないための注意事項」を追記
- **新しい技術を導入したとき** → セットアップ手順とよく使うコマンドを追記
- **コーディング規約が変わったとき** → 古い記述を削除して新しいルールに更新
- **新メンバーが「わからなかった」と言ったとき** → その内容を追記

---

## 7-2. 権限・セキュリティの考え方

### `--dangerously-skip-permissions` を使わないために

Claude Code には起動時のオプションとして `--dangerously-skip-permissions` があります。
これはすべての確認をスキップして、Claude Code が何でも自動実行できるモードです。

**このオプションは基本的に使うべきではありません。**

| 確認なし（危険） | 確認あり（安全） |
|---|---|
| 意図しないファイルの削除に気づけない | diff を確認して承認できる |
| 重要ファイルへの書き込みを止められない | `deny` 設定でブロックできる |
| 何が変わったかわからない | 変更前後を把握できる |

確認を減らしたいなら `settings.json` の `allow` リストを活用しましょう（第5章参照）。
あくまで「信頼できる操作だけを allow に入れる」アプローチが安全です。

### 機密情報の扱い

Claude Code はファイルを読んでから作業します。
プロジェクトに機密情報が含まれる場合は注意が必要です。

**やること：**

```gitignore
# .gitignore に追加（Claude Code はこれを尊重する）
.env
*.key
secrets/
```

**CLAUDE.md に明示する：**

```markdown
## 触ってはいけないファイル
- .env（環境変数・シークレットが含まれる）
- certs/（SSL証明書）
- これらのファイルの内容をコードにハードコードしない
```

### API キーの保護

MCP や外部連携で API キーを使う場合、設定ファイルに直書きしていると git に混入するリスクがあります。

```bash
# 環境変数から読み込む（シェルの設定ファイルに書く）
export GITHUB_TOKEN="ghp_xxxx"
```

```json
// settings.json ではシェル変数を展開して渡せない場合がある
// その場合は起動スクリプトを使う
```

```bash
# claude-start.sh（.gitignore に追加する）
#!/bin/bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxx"
claude "$@"
```

---

## 7-3. CI/CD に組み込む

Claude Code は `--print` オプションで非インタラクティブモード（headless モード）で実行できます。
これを使って CI/CD パイプラインに組み込めます。

### 基本的な使い方（headless モード）

```bash
# 指示を渡して結果を取得する
claude --print "src/ 以下の TypeScript コンパイルエラーを確認して、エラーがあれば修正して"

# ファイルに書いた指示を渡す
claude --print < prompt.txt
```

### GitHub Actions での使用例

**PR のコードレビューを自動化する**

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run AI Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          git diff origin/main...HEAD > diff.txt
          claude --print "以下の diff をコードレビューして。
          バグ・型安全性・エラーハンドリングの観点で問題点を箇条書きにして。
          問題がなければ「問題なし」と答えて。
          $(cat diff.txt)" > review.txt
          cat review.txt

      - name: Post Review Comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## AI レビュー\n\n${review}`
            });
```

**コミット前の自動チェック（git hook）**

```bash
# .git/hooks/pre-commit（実行権限を付与: chmod +x）
#!/bin/bash

echo "AI による変更チェックを実行中..."
result=$(claude --print "git diff --cached の変更を確認して、明らかなバグや問題があれば報告して。なければ「OK」とだけ答えて")

if echo "$result" | grep -v "^OK$" | grep -q "."; then
  echo "AI チェック結果:"
  echo "$result"
  echo ""
  read -p "このままコミットしますか？ (y/n): " answer
  if [ "$answer" != "y" ]; then
    exit 1
  fi
fi
```

### headless モードの注意点

- `ANTHROPIC_API_KEY` 環境変数が必要です（CI 環境では Secrets に登録する）
- 実行するたびに API コストが発生します。毎コミットに走らせると費用が積み上がります
- PR への自動コメントは「うるさい」と感じるメンバーもいるので、チームで合意してから導入しましょう

---

## 7-4. コスト管理

### コストの確認方法

セッションの使用量は `/cost` で確認できます：

```
> /cost
```

```
Session cost: $0.42
  Input tokens:  12,450
  Output tokens: 3,210
```

### コストを抑えるコツ

**1. CLAUDE.md を簡潔に保つ**

CLAUDE.md は毎回読み込まれるため、長すぎるとセッションごとにコストがかかります。
不要になった情報は削除しましょう。

**2. `/compact` を活用する**

長いセッションでは会話が蓄積してトークンが増えます。
作業の区切りで `/compact` を使うと圧縮されてコストが下がります。

**3. スコープを絞った指示を使う**

```
# コストが高くなりやすい
> プロジェクト全体を読んで、改善点を洗い出して

# コストを抑えやすい
> src/routes/todos.ts だけ読んで、このファイルの問題点を3つ挙げて
```

**4. タスクを終えたらセッションを閉じる**

Claude Code を起動したままにしておくとトークンが蓄積します。
作業が終わったら `/exit` で閉じましょう。

### 月次の使用量を確認する

Anthropic のコンソール（console.anthropic.com）でアカウント全体の使用量を確認できます。
チームで使っている場合は、月初に確認して予算内かどうかをチェックする習慣をつけましょう。

---

## 7-5. チームへの導入ステップ

個人で使いこなせてきたら、チームへの展開を考えましょう。

### ステップ1：自分が成果を出して見せる

「このバグを10分で直した」「テストを自動生成した」などの実績を作ります。
「使ってみて」より「こんなことができた」を見せる方が説得力があります。

### ステップ2：CLAUDE.md を整備してリポジトリに入れる

個人設定を外に出し、チームで使えるように CLAUDE.md を整備します。
プルリクエストで「Claude Code 導入」として提案すると議論しやすいです。

### ステップ3：使い方をドキュメント化する

このチュートリアルのような資料を社内向けに作ります。
第1〜3章の内容を「このプロジェクト向け」にカスタマイズするだけで十分です。

### ステップ4：ルールをチームで決める

- どんな操作を `allow` にするか
- `git push` は Claude Code から行うか・手動か
- CI でのレビュー自動化を入れるか

最初は小さく始めて、慣れたらルールを拡張するのが安全です。

---

## よくあるつまずきポイント

### チームメンバーが「信用できない」と感じる

Claude Code が何をしているか見えないと不安になります。
**差分を必ず見てから承認する** ルールを徹底することが信頼の第一歩です。
「Claude が書いたコードでもレビューは人間がやる」を原則にしましょう。

### 人によって使い方がバラバラになる

CLAUDE.md とカスタムコマンド（`.claude/commands/`）をリポジトリに入れて統一します。
チームで使う操作はカスタムコマンドにしておくと「このプロジェクトでは `/pr-ready` を使う」と伝えるだけで済みます。

### CI のコストが想定より高い

すべての PR に AI レビューを走らせると費用が積み上がります。
「ドラフト PR はスキップ」「変更が小さい場合はスキップ」などの条件を入れましょう。

```yaml
# PR の変更行数が 50 行以下ならスキップ
- name: Check diff size
  run: |
    lines=$(git diff origin/main...HEAD --stat | tail -1 | awk '{print $4}')
    if [ "$lines" -lt 50 ]; then
      echo "skip=true" >> $GITHUB_OUTPUT
    fi
```

---

## 演習問題

### 演習 7-1（必須）：チーム向け CLAUDE.md を書く

仮想のチームプロジェクトを想定して、以下のセクションをすべて含む CLAUDE.md を書いてみましょう：

- ブランチ戦略
- コミットメッセージ規約
- レビュー観点
- やってはいけないこと

書き終えたら Claude Code に「このプロジェクトのブランチ名の付け方のルールは？」と聞いて、正確に答えられるか確認してください。

### 演習 7-2（必須）：settings.json でセキュリティ設定

以下の要件を満たす `.claude/settings.json` を作成してください：

- テスト・ビルドコマンドは確認なしで実行できる
- `git push` はできない（deny）
- `.env` ファイルへの書き込みはできない（deny）

### 演習 7-3（発展）：GitHub Actions でレビュー自動化

todo-api を GitHub に push して、PR を作ったときに AI レビューコメントが投稿される GitHub Actions を設定してみましょう。

ヒント：`ANTHROPIC_API_KEY` は GitHub の Settings → Secrets and variables → Actions に登録します。

---

## まとめ

| 学んだこと | ポイント |
|---|---|
| チームでの CLAUDE.md | git 管理して PR でレビュー。「なぜ」も書く |
| セキュリティ | `--dangerously-skip-permissions` は使わない。機密ファイルは deny に |
| CI/CD 連携 | `--print` オプションで headless モード。費用に注意 |
| コスト管理 | `/cost` で確認、`/compact` で圧縮、スコープを絞る |
| チーム導入 | 実績 → CLAUDE.md 整備 → ドキュメント化 → ルール策定の順で |

---

## チュートリアル完了

お疲れ様でした。全7章を通じて、Claude Code の基本から実務・チーム運用まで学びました。

### 学んだことの全体像

| 章 | テーマ | 身についたこと |
|---|---|---|
| 第1章 | セットアップ | 環境構築・CLAUDE.md の作り方 |
| 第2章 | 基本操作 | ファイルの渡し方・変更の承認と取り消し |
| 第3章 | 実務ワークフロー | バグ修正・機能追加・テスト生成・レビュー |
| 第4章 | プロンプト | 意図通りに伝える技術・失敗の立て直し方 |
| 第5章 | カスタマイズ | スラッシュコマンド・hooks・パーミッション設定 |
| 第6章 | MCP 連携 | GitHub・DB 等との外部連携 |
| 第7章 | チーム運用 | CLAUDE.md 管理・セキュリティ・CI/CD |

### 次のステップ

1. **実際のプロジェクトで使い続ける** — チュートリアルで学んだパターンを毎日の開発に適用しましょう
2. **CLAUDE.md を育てる** — 使うたびに「毎回言っていること」を追記する習慣をつける
3. **カスタムコマンドを増やす** — 繰り返す操作をコマンド化して効率化する
4. **チームに展開する** — 就職後、同じチームのメンバーに使い方を共有する

Claude Code は使い込むほど精度が上がります。ぜひ積極的に使い続けてください。
