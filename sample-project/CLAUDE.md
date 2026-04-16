# CLAUDE.md

## プロジェクト概要

Claude Code チュートリアル用のサンプルプロジェクト。
TypeScript + Express で作った TODO 管理 REST API。
第1〜3章の演習を終えた状態のコード。

## 技術スタック

- Node.js 20
- TypeScript 5
- Express 4
- Jest + supertest（テスト）

## ディレクトリ構成

```
src/
├── index.ts          エントリーポイント・Express 初期化
├── routes/
│   └── todos.ts      TODO の CRUD ルーティング
├── types/
│   └── todo.ts       型定義
└── __tests__/
    └── todos.test.ts テスト
```

## よく使うコマンド

```bash
npm run dev       # 開発サーバー起動（ts-node）
npm test          # テスト実行
npm run typecheck # 型チェックのみ（コンパイルしない）
npm run build     # dist/ にビルド
```

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | /todos | 一覧取得（?done=true/false, ?priority=high/medium/low） |
| GET | /todos/:id | 1件取得 |
| POST | /todos | 作成 |
| PATCH | /todos/:id | 更新 |
| DELETE | /todos/:id | 削除 |

## コーディング規約

- `any` 型禁止
- エラーレスポンスは `{ error: string }` の形式に統一
- バリデーションは各ルートで行う（ライブラリ不使用）
- テストを変更するときは必ず一緒に修正する

## 注意事項

- `src/index.ts` は `require.main === module` のガードがあるためテスト時はサーバーを起動しない
- インメモリ配列で状態を管理しているため、サーバー再起動でデータはリセットされる
