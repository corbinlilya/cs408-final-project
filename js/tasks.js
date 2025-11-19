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
