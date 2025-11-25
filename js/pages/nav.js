// /js/pages/nav.js
import { requireUsernameOrRedirect } from "../core/user.js";

const username = requireUsernameOrRedirect();

const homeLink = document.getElementById("home");
const tasksLink = document.getElementById("tasks");
const historyLink = document.getElementById("history");

if (homeLink) {
  homeLink.addEventListener("click", () => {
    window.location.href = `/home.html?user=${encodeURIComponent(username)}`;
  });
}

if (tasksLink) {
  tasksLink.addEventListener("click", () => {
    window.location.href = `/tasks.html?user=${encodeURIComponent(username)}`;
  });
}

if (historyLink) {
  historyLink.addEventListener("click", () => {
    window.location.href = `/history.html?user=${encodeURIComponent(username)}`;
  });
}
