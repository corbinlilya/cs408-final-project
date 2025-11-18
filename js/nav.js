const params = new URLSearchParams(window.location.search);
const username = params.get("user"); // "corbinlilya" from your URL

if (username === null) {
    // If no username, redirect to index.html
    window.location.href = "/index.html";
} 

document.getElementById("home").addEventListener("click", () => {
    window.location.href = `/home.html?user=${encodeURIComponent(username)}`;
});


document.getElementById("tasks").addEventListener("click", () => {
    window.location.href = `/tasks.html?user=${encodeURIComponent(username)}`;
});


document.getElementById("history").addEventListener("click", () => {
    window.location.href = `/history.html?user=${encodeURIComponent(username)}`;
});