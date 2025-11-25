export function getUsernameFromUrlOrNull() {
  const params = new URLSearchParams(window.location.search);
  return params.get("user");
}

export function requireUsernameOrRedirect() {
  const username = getUsernameFromUrlOrNull();
  if (!username) {
    window.location.href = "/index.html";
  }
  return username;
}
