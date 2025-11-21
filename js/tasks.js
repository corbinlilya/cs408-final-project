const params = new URLSearchParams(window.location.search);
const username = params.get("user");

const API_BASE = "https://i2sgiec8za.execute-api.us-east-2.amazonaws.com";

const taskTableBody = document.getElementById("taskTableBody");

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

// Turn "3 hours 20 minutes 5 seconds" into total seconds
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

        // --- Task name (editable input) ---
        const nameTd = document.createElement("td");
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = task.title;
        nameInput.className = "task-input";
        nameTd.appendChild(nameInput);

        // --- Duration (editable input) ---
        const durTd = document.createElement("td");
        const durInput = document.createElement("input");
        durInput.type = "text";
        durInput.value = formatDuration(task.durationSeconds);
        durInput.className = "task-input";
        durTd.appendChild(durInput);

        // --- Remove button ---
        const removeTd = document.createElement("td");
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "−";
        removeBtn.dataset.id = task.id;
        removeTd.appendChild(removeBtn);

        row.appendChild(nameTd);
        row.appendChild(durTd);
        row.appendChild(removeTd);
        taskTableBody.appendChild(row);

        // ===== HOW WE SAVE =====
        // 1) Saving title on blur or Enter
        nameInput.addEventListener("blur", async () => {
            const newTitle = nameInput.value.trim();
            if (!newTitle || newTitle === task.title) {
                nameInput.value = task.title;
                return;
            }
            await updateTask(task.id, { title: newTitle });
            task.title = newTitle;
        });

        nameInput.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                nameInput.blur(); // triggers blur handler above
            }
        });

        // 2) Saving duration on blur or Enter
        durInput.addEventListener("blur", async () => {
            const parsedSeconds = parseDurationString(durInput.value);
            if (parsedSeconds === null) {
                // invalid → reset to previous
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

loadTasks();
