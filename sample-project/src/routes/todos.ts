import { Router, Request, Response } from "express";
import { Todo, CreateTodoInput, UpdateTodoInput, Priority } from "../types/todo";

export const todosRouter = Router();

const todos: Todo[] = [];
let nextId = 1;

const VALID_PRIORITIES: Priority[] = ["high", "medium", "low"];

// GET /todos — 一覧取得（?done=true/false・?priority=high でフィルタ可）
todosRouter.get("/", (req: Request, res: Response) => {
  let result = [...todos];

  if (req.query.done !== undefined) {
    const done = req.query.done === "true";
    result = result.filter((t) => t.done === done);
  }

  if (req.query.priority !== undefined) {
    const priority = req.query.priority as string;
    if (!VALID_PRIORITIES.includes(priority as Priority)) {
      return res.status(400).json({ error: "priority は high / medium / low のいずれかを指定してください" });
    }
    result = result.filter((t) => t.priority === priority);
  }

  res.json(result);
});

// GET /todos/:id — 1件取得
todosRouter.get("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "id は数値で指定してください" });
  }

  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: `id: ${id} の TODO が見つかりません` });
  }

  res.json(todo);
});

// POST /todos — 作成
todosRouter.post("/", (req: Request, res: Response) => {
  const { title, priority }: CreateTodoInput = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title は必須です" });
  }
  if (title.trim().length > 100) {
    return res.status(400).json({ error: "title は100文字以内で入力してください" });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: "priority は high / medium / low のいずれかを指定してください" });
  }

  const todo: Todo = {
    id: nextId++,
    title: title.trim(),
    done: false,
    priority: priority ?? "medium",
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PATCH /todos/:id — 更新
todosRouter.patch("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "id は数値で指定してください" });
  }

  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: `id: ${id} の TODO が見つかりません` });
  }

  const { title, done, priority }: UpdateTodoInput = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "title は空にできません" });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({ error: "title は100文字以内で入力してください" });
    }
    todo.title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({ error: "done は true / false で指定してください" });
    }
    todo.done = done;
  }

  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: "priority は high / medium / low のいずれかを指定してください" });
    }
    todo.priority = priority;
  }

  res.json(todo);
});

// DELETE /todos/:id — 削除
todosRouter.delete("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "id は数値で指定してください" });
  }

  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `id: ${id} の TODO が見つかりません` });
  }

  todos.splice(index, 1);
  res.status(204).send();
});
