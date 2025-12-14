import { ARC_CONFIG } from "../core/config.js";
import { drawArcPath } from "../core/timerArc.js";
import { formatTime } from "../core/time.js";

const { startAngle } = ARC_CONFIG;

let fullSpan = 260.9; // demo arc span in degrees
let initialFire = false;
let animating = false;
let TOTAL_SECONDS = 12 * 60 + 41;

// DOM
const arc = document.getElementById("arc");
const section = document.getElementById("section");
const timeText = document.getElementById("timeText");

// Initial timer text
timeText.textContent = formatTime(TOTAL_SECONDS);

// Username modal DOM
const modal = document.getElementById("modal");
const form = document.getElementById("usernameForm");
const input = document.getElementById("userName");
const closeBtn = document.getElementById("close");
const dashboardBtn = document.getElementById("dashboard");

// ------------------------
// Arc + List Animations
// ------------------------

section.addEventListener("click", () => {
  if (animating) return;
  animating = true;
  animateArcToZero(1500);
});

section.addEventListener("mousemove", () => {
  if (initialFire) return;
  initialFire = true;
  animating = true;
  animateArcToZero(1500);
});

function animateList() {
  const invisible = document.getElementById("t0");
  const aboveMain = document.getElementById("t1");
  const main = document.getElementById("t2");
  const belowMain = document.getElementById("t3");

  aboveMain.classList.add("animateMain");
  main.classList.add("animateShrink");
  invisible.classList.add("animateGrow");
  belowMain.classList.add("animateOut");

  setTimeout(() => {
    const newInvisible = main.textContent;

    belowMain.textContent = main.textContent;
    main.textContent = aboveMain.textContent;
    aboveMain.textContent = invisible.textContent;
    invisible.textContent = newInvisible;

    aboveMain.classList.remove("animateMain");
    main.classList.remove("animateShrink");
    invisible.classList.remove("animateGrow");
    belowMain.classList.remove("animateOut");
  }, 500);

  setTimeout(() => {
    fullSpan = 359.99;
    animateArcReverse(500);
  }, 600);
}

function animateArcToZero(duration = 1000) {
  let startTime = null;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);

    const currentEndAngle = startAngle + fullSpan - fullSpan * t;
    drawArcPath(arc, currentEndAngle);

    const remainingSeconds = Math.max(0, Math.round(TOTAL_SECONDS * (1 - t)));
    timeText.textContent = formatTime(remainingSeconds);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      timeText.textContent = formatTime(0);
      animateList();
    }
  }

  requestAnimationFrame(tick);
}

function animateArcReverse(duration = 1500) {
  let startTime = null;
  // randomish new duration for demo
  const seconds = Number(((Math.random() % 0.6) * 100 * 60).toFixed(0));
  TOTAL_SECONDS = seconds;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);

    const currentEndAngle = startAngle + fullSpan * t;
    drawArcPath(arc, currentEndAngle);

    const currentSeconds = Math.round(seconds * t);
    timeText.textContent = formatTime(currentSeconds);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      timeText.textContent = formatTime(currentSeconds);
      animating = false;
    }
  }

  requestAnimationFrame(tick);
}

// draw initial full arc segment
drawArcPath(arc, startAngle + fullSpan);

export function sanitizeUsername(raw) {
  if (typeof raw !== "string") return null;

  // Reject ANY control chars in the original input
  if (/[\u0000-\u001F\u007F]/.test(raw)) return null;

  // Normalize and trim after the safety check
  const v = raw.normalize("NFKC").trim();

  if (v.length < 1 || v.length > 40) return null;

  return v;
}


// ------------------------
// Username Modal
// ------------------------

if (dashboardBtn) {
  dashboardBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = sanitizeUsername(input.value);
    if (!username) return;

    localStorage.setItem("onetaskUsername", username);
    window.location.href = `/home.html?user=${encodeURIComponent(username)}`;
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}
