import express from "express";
import { todosRouter } from "./routes/todos";

const app = express();
app.use(express.json());

app.use("/todos", todosRouter);

// 本番環境ではスタックトレースを返さないエラーハンドラー
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "内部エラーが発生しました" });
});

const PORT = process.env.PORT ?? 3000;

// テスト時はサーバーを起動しない
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
