// js/tasksApi.js
import { API_BASE } from "./config.js";

export async function getTasks(username, { completed } = {}) {
  const params = new URLSearchParams();
  if (typeof completed === "boolean") {
    params.set("completed", completed ? "true" : "false");
  }

  const res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(username)}/tasks${params.toString() ? "?" + params.toString() : ""}`
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GET tasks failed: ${res.status} ${text}`);
  }

  return JSON.parse(text);
}

export async function createTask(username, task) {
  const res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(username)}/tasks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create failed: ${res.status} ${text}`);
  }
}

export async function updateTask(username, taskId, partial) {
  const res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(username)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed: ${res.status} ${text}`);
  }
}

export async function deleteTask(username, taskId) {
  const res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(username)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete failed: ${res.status} ${text}`);
  }
}
