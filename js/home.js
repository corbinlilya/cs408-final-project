// Get username from search params
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

const API_BASE = "https://i2sgiec8za.execute-api.us-east-2.amazonaws.com";

// Grab DOM elements
const welcome = document.getElementById("welcome");
const form = document.getElementById("taskForm");
const input = document.getElementById("taskName");
input.value = "Test";

console.log(input.value.split(""));

const taskList = document.getElementById("taskList");
const manageTasks = document.getElementById("manageTasks");

manageTasks.addEventListener("click", () => {
    window.location.href = `/tasks.html?user=${encodeURIComponent(username)}`;
});

// Show username on page
if (username) {
  welcome.textContent = `Username: ${username}`;
} else {
  welcome.textContent = "No selected username (?user=...)";
}

// Helper: render list of tasks
function renderTasks(tasks) {
  taskList.innerHTML = "";
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = "<li>No tasks yet.</li>";
    return;
  }

  for (const t of tasks) {
    const li = document.createElement("li");
    li.textContent = `${t.title || t.name || "(no title)"} [${t.id}]`;
    taskList.appendChild(li);
  }
}

// GET /users/{user}/tasks
async function loadTasks() {
  if (!username) return;

  try {
    const res = await fetch(
      `${API_BASE}/users/${encodeURIComponent(username)}/tasks`
    );

    const text = await res.text();

    if (!res.ok) return;

    const data = JSON.parse(text);
    renderTasks(data);
  } catch (err) {
    console.error(err);
    debug.innerHTML = `<p style="color:red;">${err}</p>`;
  }
}

// POST /users/{user}/tasks
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!username) return;

  const title = input.value.trim();
  if (!title) return;

  const id = `task-${Math.random().toString(36).slice(2, 9)}`;

  const body = {
    id,
    title,
    durationSeconds: 0,
    isCompleted: false,
  };

  try {
    const res = await fetch(
      `${API_BASE}/users/${encodeURIComponent(username)}/tasks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const text = await res.text();
    debug.innerHTML = `<pre>POST ${res.status}\n${text}</pre>`;

    if (!res.ok) return;
    input.value = "";
    await loadTasks();
  } catch (err) {
    console.error(err);
    debug.innerHTML = `<p style="color:red;">${err}</p>`;
  }
});

// Load tasks when page first opens
loadTasks();
