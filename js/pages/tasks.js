// /js/pages/tasks.js
import { requireUsernameOrRedirect } from "../core/user.js";
import {
  formatDuration,
  parseHumanDuration,
  parseHmsDuration,
} from "../core/time.js";
import {
  getTasks,
  updateTask,
  deleteTask as apiDeleteTask,
  createTask,
} from "../core/tasksApi.js";

const username = requireUsernameOrRedirect();

const taskTableBody = document.getElementById("taskTableBody");
const addTaskModal = document.getElementById("addTaskModal");
const addTaskForm = document.getElementById("addTaskForm");
const addTaskClose = document.getElementById("addTaskClose");
const addTaskButton = document.getElementById("manageTasks");
const taskTitleInput = document.getElementById("taskTitleInput");
const taskDurationInput = document.getElementById("taskDurationInput");

function generateTaskId() {
  if (window.crypto?.randomUUID) {
    return "task-" + crypto.randomUUID();
  }
  return (
    "task-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

// --------------
// Modal helpers
// --------------

function openAddTaskModal() {
  if (!addTaskModal) return;
  addTaskModal.classList.remove("hidden");
  if (taskTitleInput) taskTitleInput.value = "";
  if (taskDurationInput) taskDurationInput.value = "";
  if (taskTitleInput) taskTitleInput.focus();
}

function closeAddTaskModal() {
  if (!addTaskModal) return;
  addTaskModal.classList.add("hidden");
}

if (addTaskButton) {
  addTaskButton.addEventListener("click", () => {
    openAddTaskModal();
  });
}

if (addTaskClose) {
  addTaskClose.addEventListener("click", () => {
    closeAddTaskModal();
  });
}

if (addTaskModal) {
  addTaskModal.addEventListener("click", (e) => {
    if (e.target === addTaskModal) {
      closeAddTaskModal();
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && addTaskModal && !addTaskModal.classList.contains("hidden")) {
    closeAddTaskModal();
  }
});

// --------------
// Render helpers
// --------------

function renderTasks(tasks) {
  if (!taskTableBody) return;
  taskTableBody.innerHTML = "";

  tasks.forEach((task) => {
    const row = document.createElement("tr");

    // Title
    const nameTd = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = task.title || "";
    nameInput.className = "task-input";
    nameInput.setAttribute("aria-label", "Task name");
    nameTd.appendChild(nameInput);

    // Duration
    const durTd = document.createElement("td");
    const durInput = document.createElement("input");
    durInput.type = "text";
    durInput.value = formatDuration(task.durationSeconds);
    durInput.className = "task-input";
    durInput.setAttribute("aria-label", "Time allocated (HH:MM:SS)");
    durTd.appendChild(durInput);

    // Delete
    const removeTd = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.className = "action-button";
    removeBtn.style.marginRight = "0.5rem";
    removeBtn.textContent = "Delete";
    removeBtn.style.backgroundColor = "#b30000";
    removeBtn.style.border = "none";
    removeBtn.style.color = "white";
    removeTd.appendChild(removeBtn);

    row.appendChild(nameTd);
    row.appendChild(durTd);
    row.appendChild(removeTd);
    taskTableBody.appendChild(row);

    // Save title
    nameInput.addEventListener("blur", async () => {
      const newTitle = nameInput.value.trim();
      if (!newTitle || newTitle === task.title) {
        nameInput.value = task.title || "";
        return;
      }
      try {
        await updateTask(username, task.id, { title: newTitle });
        task.title = newTitle;
      } catch (err) {
        console.error("Failed to update title:", err);
        nameInput.value = task.title || "";
      }
    });

    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        nameInput.blur();
      }
    });

    // Save duration
    durInput.addEventListener("blur", async () => {
      const parsedSeconds = parseHumanDuration(durInput.value);
      if (parsedSeconds === null) {
        durInput.value = formatDuration(task.durationSeconds);
        return;
      }

      if (parsedSeconds === task.durationSeconds) {
        durInput.value = formatDuration(task.durationSeconds);
        return;
      }

      try {
        await updateTask(username, task.id, {
          durationSeconds: parsedSeconds,
          remainingSeconds: parsedSeconds,
        });
        task.durationSeconds = parsedSeconds;
        durInput.value = formatDuration(parsedSeconds);
      } catch (err) {
        console.error("Failed to update duration:", err);
        durInput.value = formatDuration(task.durationSeconds);
      }
    });

    durInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        durInput.blur();
      }
    });

    // Delete
    removeBtn.addEventListener("click", async () => {
      try {
        await apiDeleteTask(username, task.id);
        await loadAndRenderTasks();
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    });
  });
}

async function loadAndRenderTasks() {
  if (!username) return;
  try {
    const tasks = await getTasks(username);
    renderTasks(tasks || []);
  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}

// --------------
// Add Task form
// --------------

if (addTaskForm) {
  addTaskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!username) return;

    const title = taskTitleInput.value.trim();
    const hms = taskDurationInput.value.trim();

    const durationSeconds = parseHmsDuration(hms);

    if (!title || durationSeconds === null) {
      alert("Please enter a task name and a duration as HH:MM:SS (e.g., 00:25:00).");
      return;
    }

    const newTask = {
      id: generateTaskId(),
      title,
      durationSeconds,
      remainingSeconds: durationSeconds,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await createTask(username, newTask);
      closeAddTaskModal();
      await loadAndRenderTasks();
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task. Check console for details.");
    }
  });
}

// Initial
loadAndRenderTasks();
