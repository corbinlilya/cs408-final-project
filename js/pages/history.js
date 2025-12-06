// /js/pages/history.js
import { requireUsernameOrRedirect } from "../core/user.js";
import { formatDuration } from "../core/time.js";
import {
  getTasks,
  updateTask,
  deleteTask as apiDeleteTask,
} from "../core/tasksApi.js";

const username = requireUsernameOrRedirect();

const historyTableBody = document.getElementById("historyTableBody");
const historyDebug = document.getElementById("historyDebug");

if (!username && historyDebug) {
  historyDebug.textContent = "No username provided (?user=...)";
}

// ----------
// Render
// ----------

function renderHistory(tasks) {
  if (!historyTableBody) return;

  historyTableBody.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "No completed tasks yet.";
    cell.style.textAlign = "center";
    row.appendChild(cell);
    historyTableBody.appendChild(row);
    return;
  }

  tasks.forEach((task) => {
    const row = document.createElement("tr");

    // Name
    const nameTd = document.createElement("td");
    nameTd.textContent = task.title || "(untitled)";
    row.appendChild(nameTd);

    // Duration
    const durTd = document.createElement("td");
    durTd.textContent = formatDuration(task.durationSeconds);
    row.appendChild(durTd);

    // Actions
    const actionsTd = document.createElement("td");
    actionsTd.classList.add("actions-cell");

    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "Add Back";
    restoreBtn.className = "action-button";
    restoreBtn.style.marginRight = "0.5rem";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "action-button";
    deleteBtn.style.marginRight = "0.5rem";
    deleteBtn.style.backgroundColor = "#b30000";
    deleteBtn.style.border = "none";
    deleteBtn.style.color = "white";

    actionsTd.appendChild(restoreBtn);
    actionsTd.appendChild(deleteBtn);
    row.appendChild(actionsTd);

    historyTableBody.appendChild(row);

    restoreBtn.addEventListener("click", async () => {
      try {
        const durationSeconds = task.durationSeconds ?? 0;
        await updateTask(username, task.id, {
          isCompleted: false,
          remainingSeconds: durationSeconds,
        });
        await loadCompletedTasks();
      } catch (err) {
        console.error("Failed to restore task:", err);
        if (historyDebug) {
          historyDebug.textContent = `Restore error: ${err}`;
        }
      }
    });

    deleteBtn.addEventListener("click", async () => {
      try {
        await apiDeleteTask(username, task.id);
        await loadCompletedTasks();
      } catch (err) {
        console.error("Failed to delete task:", err);
        if (historyDebug) {
          historyDebug.textContent = `Delete error: ${err}`;
        }
      }
    });
  });
}

// ----------
// Load
// ----------

async function loadCompletedTasks() {
  if (!username) return;

  try {
    const allTasks = await getTasks(username, { completed: true });
    const completedTasks = (allTasks || []).filter(
      (t) => t.isCompleted === true
    );
    renderHistory(completedTasks);
  } catch (err) {
    console.error("Error loading completed tasks:", err);
    if (historyDebug) {
      historyDebug.textContent = `Error: ${err}`;
    }
  }
}

// Initial
loadCompletedTasks();
