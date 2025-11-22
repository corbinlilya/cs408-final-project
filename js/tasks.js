const params = new URLSearchParams(window.location.search);
const username = params.get("user");

const API_BASE = "https://i2sgiec8za.execute-api.us-east-2.amazonaws.com";

const taskTableBody = document.getElementById("taskTableBody");
const addTaskModal = document.getElementById("addTaskModal");
const addTaskForm = document.getElementById("addTaskForm");
const addTaskClose = document.getElementById("addTaskClose");
const addTaskButton = document.getElementById("manageTasks");
const taskTitleInput = document.getElementById("taskTitleInput");
const taskDurationInput = document.getElementById("taskDurationInput");


function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const hLabel = `${h} hour${h === 1 ? "" : "s"}`;
    const mLabel = `${m} minute${m === 1 ? "" : "s"}`;
    const sLabel = `${s} second${s === 1 ? "" : "s"}`;

    return `${hLabel} ${mLabel} ${sLabel}`;
}

function parseDurationString(str) {
    if (!str) return null;
    const lower = str.toLowerCase();

    const hMatch = lower.match(/(\d+)\s*hour/);
    const mMatch = lower.match(/(\d+)\s*minute/);
    const sMatch = lower.match(/(\d+)\s*second/);

    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    const s = sMatch ? parseInt(sMatch[1], 10) : 0;

    if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) return null;
    return h * 3600 + m * 60 + s;
}

function generateTaskId() {
  if (window.crypto?.randomUUID) {
    return "task-" + crypto.randomUUID();
  }
  return "task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function openAddTaskModal() {
  if (!addTaskModal) return;
  addTaskModal.classList.remove("hidden");
  taskTitleInput.value = "";
  taskDurationInput.value = "";
  taskTitleInput.focus();
}

function closeAddTaskModal() {
  if (!addTaskModal) return;
  addTaskModal.classList.add("hidden");
}

// Open on "Add Task" button click
if (addTaskButton) {
  addTaskButton.addEventListener("click", () => {
    openAddTaskModal();
  });
}

// Close on "Cancel" button
if (addTaskClose) {
  addTaskClose.addEventListener("click", () => {
    closeAddTaskModal();
  });
}

// Close when clicking the dark overlay
if (addTaskModal) {
  addTaskModal.addEventListener("click", (e) => {
    if (e.target === addTaskModal) {
      closeAddTaskModal();
    }
  });
}

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !addTaskModal.classList.contains("hidden")) {
    closeAddTaskModal();
  }
});



function parseHmsDuration(str) {
  if (!str) return null;
  const parts = str.split(":").map(p => p.trim());
  if (parts.length !== 3) return null;

  const [hStr, mStr, sStr] = parts;
  const h = Number(hStr);
  const m = Number(mStr);
  const s = Number(sStr);

  if (
    !Number.isInteger(h) || h < 0 ||
    !Number.isInteger(m) || m < 0 || m > 59 ||
    !Number.isInteger(s) || s < 0 || s > 59
  ) {
    return null;
  }

  return h * 3600 + m * 60 + s;
}


async function loadTasks() {
    if (!username) return;

    try {
        const res = await fetch(
            `${API_BASE}/users/${encodeURIComponent(username)}/tasks`
        );
        const raw = await res.text();

        if (!res.ok) {
            console.error("Error loading tasks:", raw);
            return;
        } 

        const tasks = JSON.parse(raw);
        renderTasks(tasks);
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

function renderTasks(tasks) {
    taskTableBody.innerHTML = "";

    tasks.forEach(task => {
        const row = document.createElement("tr");

        // Render task name
        const nameTd = document.createElement("td");
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = task.title;
        nameInput.className = "task-input";
        nameTd.appendChild(nameInput);

        // Editable duration
        const durTd = document.createElement("td");
        const durInput = document.createElement("input");
        durInput.type = "text";
        durInput.value = formatDuration(task.durationSeconds);
        durInput.className = "task-input";
        durTd.appendChild(durInput);

        // Delete Button
        const removeTd = document.createElement("td");
        const removeBtn = document.createElement("button");
        removeBtn.className = "action-button";
        removeBtn.style.marginRight = "0.5rem";
        removeBtn.textContent = "Delete";
        removeBtn.style.backgroundColor = 'red';
        removeBtn.style.border = 'none';
        removeBtn.style.color = 'white';
        removeBtn.dataset.id = task.id;
        removeTd.appendChild(removeBtn);

        row.appendChild(nameTd);
        row.appendChild(durTd);
        row.appendChild(removeTd);
        taskTableBody.appendChild(row);

        // Save title by blurring or entering
        nameInput.addEventListener("blur", async () => {
            const newTitle = nameInput.value.trim();
            if (!newTitle || newTitle === task.title) {
                nameInput.value = task.title;
                return;
            }
            console.log(task.id, newTitle);
            await updateTask(task.id, { title: newTitle });
            task.title = newTitle;
        });

        nameInput.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                nameInput.blur();
            }
        });

        // Save duration on blur or Enter
        durInput.addEventListener("blur", async () => {
            const parsedSeconds = parseDurationString(durInput.value);
            if (parsedSeconds === null) {
                durInput.value = formatDuration(task.durationSeconds);
                return;
            }

            if (parsedSeconds === task.durationSeconds) {
                durInput.value = formatDuration(task.durationSeconds);
                return;
            }

            await updateTask(task.id, {
                durationSeconds: parsedSeconds,
                remainingSeconds: parsedSeconds
            });

            task.durationSeconds = parsedSeconds;
            durInput.value = formatDuration(parsedSeconds);
        });

        durInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                durInput.blur(); // trigger save
            }
        });

        // Delete
        removeBtn.addEventListener("click", async (e) => {
            const id = e.target.dataset.id;
            await deleteTask(id);
            loadTasks();
        });
    });
}

async function updateTask(taskId, partial) {
    try {
        await fetch(
            `${API_BASE}/users/${encodeURIComponent(username)}/tasks/${encodeURIComponent(taskId)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(partial)
            }
        );
    } catch (err) {
        console.error("Failed to update task:", err);
    }
}

async function deleteTask(taskId) {
    try {
        await fetch(
            `${API_BASE}/users/${encodeURIComponent(username)}/tasks/${encodeURIComponent(taskId)}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            }
        );
    } catch (err) {
        console.error("Failed to delete:", err);
    }
}

if (addTaskForm) {
  addTaskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!username) return;

    const title = taskTitleInput.value.trim();
    const durationSeconds = parseHmsDuration(taskDurationInput.value);

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
      const res = await fetch(
        `${API_BASE}/users/${encodeURIComponent(username)}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTask),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to create task:", res.status, text);
        alert("Failed to create task. Check console for details.");
        return;
      }

      closeAddTaskModal();
      await loadTasks(); // re-render table with the new task
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Error creating task. Check console for details.");
    }
  });
}


loadTasks();
