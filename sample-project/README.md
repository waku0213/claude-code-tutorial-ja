# todo-api

Claude Code チュートリアル用サンプルプロジェクト。
TypeScript + Express で作った TODO 管理 REST API です。

## セットアップ

```bash
npm install
npm run dev
```

サーバーが `http://localhost:3000` で起動します。

## 動作確認

```bash
# TODO を作成
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Claude Code を覚える", "priority": "high"}'

# 一覧を取得
curl http://localhost:3000/todos

# 完了済みのみ取得
curl "http://localhost:3000/todos?done=true"

# 更新
curl -X PATCH http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"done": true}'

# 削除
curl -X DELETE http://localhost:3000/todos/1
```

## テスト

```bash
npm test
```

## このプロジェクトについて

[Claude Code チュートリアル](../README.md) の第1〜3章の演習を通じて作るコードの完成版です。
チュートリアルを進めながら、このコードを参考にしてください。
