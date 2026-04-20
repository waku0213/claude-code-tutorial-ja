import request from "supertest";
import { app } from "../index";

// 各テスト前にサーバーの状態をリセットするため、モジュールキャッシュをクリア
beforeEach(() => {
  jest.resetModules();
});

describe("GET /todos", () => {
  it("TODO が0件のとき空配列を返す", async () => {
    const res = await request(app).get("/todos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("作成した TODO を全件返す", async () => {
    await request(app).post("/todos").send({ title: "タスク1" });
    await request(app).post("/todos").send({ title: "タスク2" });

    const res = await request(app).get("/todos");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("?done=true で完了済みのみ返す", async () => {
    const created = await request(app).post("/todos").send({ title: "完了タスク" });
    await request(app).patch(`/todos/${created.body.id}`).send({ done: true });
    await request(app).post("/todos").send({ title: "未完了タスク" });

    const res = await request(app).get("/todos?done=true");
    expect(res.status).toBe(200);
    expect(res.body.every((t: { done: boolean }) => t.done === true)).toBe(true);
  });

  it("?done=false で未完了のみ返す", async () => {
    const created = await request(app).post("/todos").send({ title: "完了タスク" });
    await request(app).patch(`/todos/${created.body.id}`).send({ done: true });
    await request(app).post("/todos").send({ title: "未完了タスク" });

    const res = await request(app).get("/todos?done=false");
    expect(res.status).toBe(200);
    expect(res.body.every((t: { done: boolean }) => t.done === false)).toBe(true);
  });

  it("?priority=high で高優先度のみ返す", async () => {
    await request(app).post("/todos").send({ title: "高優先度", priority: "high" });
    await request(app).post("/todos").send({ title: "低優先度", priority: "low" });

    const res = await request(app).get("/todos?priority=high");
    expect(res.status).toBe(200);
    expect(res.body.every((t: { priority: string }) => t.priority === "high")).toBe(true);
  });

  it("不正な priority を指定したとき 400 を返す", async () => {
    const res = await request(app).get("/todos?priority=invalid");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /todos/:id", () => {
  it("存在する ID を指定したとき TODO を返す", async () => {
    const created = await request(app).post("/todos").send({ title: "テスト" });
    const res = await request(app).get(`/todos/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("テスト");
  });

  it("存在しない ID を指定したとき 404 を返す", async () => {
    const res = await request(app).get("/todos/99999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("数値以外の ID を指定したとき 400 を返す", async () => {
    const res = await request(app).get("/todos/abc");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /todos", () => {
  it("title を渡すと 201 と作成された TODO を返す", async () => {
    const res = await request(app).post("/todos").send({ title: "新しいタスク" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("新しいタスク");
    expect(res.body.done).toBe(false);
    expect(res.body.priority).toBe("medium");
    expect(res.body.id).toBeDefined();
  });

  it("priority を指定して作成できる", async () => {
    const res = await request(app).post("/todos").send({ title: "重要タスク", priority: "high" });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe("high");
  });

  it("title が空文字のとき 400 を返す", async () => {
    const res = await request(app).post("/todos").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("title が未定義のとき 400 を返す", async () => {
    const res = await request(app).post("/todos").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("title が空白のみのとき 400 を返す", async () => {
    const res = await request(app).post("/todos").send({ title: "   " });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("title が101文字以上のとき 400 を返す", async () => {
    const res = await request(app).post("/todos").send({ title: "あ".repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("複数作成したとき id が連番になる", async () => {
    const res1 = await request(app).post("/todos").send({ title: "1つ目" });
    const res2 = await request(app).post("/todos").send({ title: "2つ目" });
    expect(res2.body.id).toBe(res1.body.id + 1);
  });
});

describe("PATCH /todos/:id", () => {
  it("title を更新できる", async () => {
    const created = await request(app).post("/todos").send({ title: "元のタイトル" });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .send({ title: "新しいタイトル" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("新しいタイトル");
  });

  it("done を true に更新できる", async () => {
    const created = await request(app).post("/todos").send({ title: "タスク" });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .send({ done: true });
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  it("存在しない ID のとき 404 を返す", async () => {
    const res = await request(app).patch("/todos/99999").send({ title: "更新" });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("title を空文字にしようとしたとき 400 を返す", async () => {
    const created = await request(app).post("/todos").send({ title: "タスク" });
    const res = await request(app)
      .patch(`/todos/${created.body.id}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /todos/:id", () => {
  it("存在する TODO を削除すると 204 を返す", async () => {
    const created = await request(app).post("/todos").send({ title: "削除するタスク" });
    const res = await request(app).delete(`/todos/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it("削除後に GET すると 404 になる", async () => {
    const created = await request(app).post("/todos").send({ title: "削除するタスク" });
    await request(app).delete(`/todos/${created.body.id}`);
    const res = await request(app).get(`/todos/${created.body.id}`);
    expect(res.status).toBe(404);
  });

  it("存在しない ID のとき 404 を返す", async () => {
    const res = await request(app).delete("/todos/99999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
