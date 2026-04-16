export type Priority = "high" | "medium" | "low";

export interface Todo {
  id: number;
  title: string;
  done: boolean;
  priority: Priority;
  createdAt: string;
}

export interface CreateTodoInput {
  title: string;
  priority?: Priority;
}

export interface UpdateTodoInput {
  title?: string;
  done?: boolean;
  priority?: Priority;
}
