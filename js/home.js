// ------------------------------------
// 1. Get the username from the URL
// ------------------------------------
const params = new URLSearchParams(window.location.search);
const username = params.get("user"); // "corbinlilya"

console.log("Logged-in user:", username);

// ------------------------------------
// 2. API endpoint
// ------------------------------------
const API_BASE = "https://i2sgiec8za.execute-api.us-east-2.amazonaws.com";

// ------------------------------------
// 3. DOM elements
// ------------------------------------
const form = document.getElementById("taskForm");
const input = document.getElementById("taskName");
const output = document.getElementById("output");

// ------------------------------------
// 4. Handle form submit
// ------------------------------------
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = input.value.trim();
    if (!name) return;

    // Optional: generate a random task ID
    const id = `task-${Math.random().toString(36).substring(2, 9)}`;

    try {
        const res = await fetch(`${API_BASE}/items`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id,
                name,
                price: 0 // whatever you want
            }),
        });

        const data = await res.json();
        output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (err) {
        output.innerHTML = `<p style="color:red;">${err}</p>`;
    }
});
