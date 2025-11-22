// Config & DOM
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

const API_BASE = "https://i2sgiec8za.execute-api.us-east-2.amazonaws.com";

const historyTableBody = document.getElementById("historyTableBody");
const historyDebug = document.getElementById("historyDebug");

if (!username && historyDebug) {
    historyDebug.textContent = "No username provided (?user=...)";
}

// Helpers
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

async function deleteTask(taskId) {
    if (!username) return;

    try {
        const res = await fetch(
            `${API_BASE}/users/${encodeURIComponent(username)}/tasks/${encodeURIComponent(taskId)}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            }
        );

        const text = await res.text();

        if (!res.ok) {
            console.error("Failed to delete task:", res.status, text);
            if (historyDebug) {
                historyDebug.textContent = `Delete failed: ${res.status} ${text}`;
            }
            return;
        }

        await loadCompletedTasks();
    } catch (err) {
        console.error("Failed to delete task:", err);
        if (historyDebug) historyDebug.textContent = `Delete error: ${err}`;
    }
}

async function restoreTask(task) {
    if (!username) return;
    if (!task || !task.id) return;

    const durationSeconds = task.durationSeconds ?? 0;

    try {
        const res = await fetch(
            `${API_BASE}/users/${encodeURIComponent(username)}/tasks/${encodeURIComponent(task.id)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isCompleted: false,
                    remainingSeconds: durationSeconds,
                }),
            }
        );

        const text = await res.text();

        if (!res.ok) {
            console.error("Failed to restore task:", res.status, text);
            if (historyDebug) {
                historyDebug.textContent = `Restore failed: ${res.status} ${text}`;
            }
            return;
        }

        await loadCompletedTasks();
    } catch (err) {
        console.error("Failed to restore task:", err);
        if (historyDebug) historyDebug.textContent = `Restore error: ${err}`;
    }
}

// ==============================
// Render
// ==============================

function renderHistory(tasks) {
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

        // Task name
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
        deleteBtn.textContent = "";
        deleteBtn.className = "action-button";
        deleteBtn.style.marginRight = "0.5rem";
        deleteBtn.textContent = "Delete";
        deleteBtn.style.backgroundColor = 'red';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = 'white';
        restoreBtn.addEventListener("click", () => restoreTask(task));
        deleteBtn.addEventListener("click", () => deleteTask(task.id));

        actionsTd.appendChild(restoreBtn);
        actionsTd.appendChild(deleteBtn);
        row.appendChild(actionsTd);

        historyTableBody.appendChild(row);
    });
}

// ==============================
// Load
// ==============================

async function loadCompletedTasks() {
    if (!username) return;

    try {
        const res = await fetch(
            `${API_BASE}/users/${encodeURIComponent(username)}/tasks?completed=true`
        );

        const text = await res.text();

        if (!res.ok) {
            console.error("GET tasks failed:", res.status, text);
            if (historyDebug) {
                historyDebug.textContent = `GET ${res.status}: ${text}`;
            }
            return;
        }

        const allTasks = JSON.parse(text);
        console.log(allTasks);

        const completedTasks = (allTasks || []).filter(
            (t) => t.isCompleted === true
        );

        renderHistory(completedTasks);
    } catch (err) {
        console.error("Error loading completed tasks:", err);
        if (historyDebug) historyDebug.textContent = `Error: ${err}`;
    }
}

// Initial load
loadCompletedTasks();
