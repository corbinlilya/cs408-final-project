// /js/pages/home.js
import { requireUsernameOrRedirect } from "../core/user.js";
import { ARC_CONFIG } from "../core/config.js";
import { formatTime } from "../core/time.js";
import { getTasks, updateTask } from "../core/tasksApi.js";
import { drawArcPath } from "../core/timerArc.js";
import { createTaskStack } from "../core/taskStack.js";

const username = requireUsernameOrRedirect();

// ----------------------
// Timer state
// ----------------------
const { startAngle, fullArcSpan: FULL_ARC_SPAN } = ARC_CONFIG;

let currentEndAngle = startAngle;
let fullSpan = 0;
let totalSeconds = 0;
let currentDurationSeconds = 0;

let timerRunning = false;
let tasks = [];

// ----------------------
// DOM
// ----------------------
const welcome = document.getElementById("welcome");
const manageTasks = document.getElementById("manageTasks");

const arc = document.getElementById("arc");
const section = document.getElementById("section");
const timeText = document.getElementById("timeText");

const invisible = document.getElementById("t0");
const aboveMain = document.getElementById("t1");
const main = document.getElementById("t2");
const belowMain = document.getElementById("t3");

const startBtn = document.getElementById("start");
const nextBtn = document.getElementById("next");
const debug = document.getElementById("debug");

// Username label
if (welcome && username) {
  welcome.textContent = `Username: ${username}`;
}

// Navigate to full task list
if (manageTasks) {
  manageTasks.addEventListener("click", () => {
    window.location.href = `/tasks.html?user=${encodeURIComponent(username)}`;
  });
}

// ----------------------
// Stack setup
// ----------------------
const stack = createTaskStack({
  invisible,
  aboveMain,
  main,
  belowMain,
  onMainChanged: () => {
    timerRunning = false;
    if (startBtn) startBtn.textContent = "Start";
    setupTimerForCurrentTask();
    animateArcReverse(500);
  },
});

function getCurrentTask() {
  if (!tasks || tasks.length === 0) return null;
  const currentTitle = stack.getCurrentTitle();
  return tasks.find((t) => t.title === currentTitle) ?? null;
}

// ----------------------
// Timer + arc helpers
// ----------------------

function setupTimerForCurrentTask() {
  const task = getCurrentTask();

  if (!task) {
    totalSeconds = 0;
    currentDurationSeconds = 0;
    fullSpan = 0;
    currentEndAngle = startAngle;
    drawArcPath(arc, currentEndAngle);
    timeText.textContent = "0:00";
    return;
  }

  currentDurationSeconds = task.durationSeconds ?? 0;
  const remaining = task.remainingSeconds ?? currentDurationSeconds;

  totalSeconds = Math.max(0, remaining);

  if (currentDurationSeconds > 0) {
    const ratio = Math.max(
      0,
      Math.min(1, totalSeconds / currentDurationSeconds)
    );
    fullSpan = FULL_ARC_SPAN * ratio;
  } else {
    fullSpan = 0;
  }

  currentEndAngle = startAngle + fullSpan;
  drawArcPath(arc, currentEndAngle);
  timeText.textContent = formatTime(totalSeconds);
}

async function saveTimerState() {
  const task = getCurrentTask();
  if (!username || !task || !task.id) return;

  try {
    await updateTask(username, task.id, {
      remainingSeconds: totalSeconds,
    });
    task.remainingSeconds = totalSeconds;
  } catch (err) {
    console.error("Error saving timer state:", err);
  }
}

async function pauseTimer() {
  timerRunning = false;
  await saveTimerState();
}

// Autosave every 15s while timer is running
setInterval(() => {
  if (timerRunning) {
    saveTimerState();
  }
}, 15000);

function animateArcReverse(duration = 1500) {
  let startTime = null;

  const targetSpan = fullSpan;
  const targetSeconds = totalSeconds;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

    currentEndAngle = startAngle + targetSpan * t;
    drawArcPath(arc, currentEndAngle);

    const currentSeconds = Math.round(targetSeconds * t);
    timeText.textContent = formatTime(currentSeconds);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      timeText.textContent = formatTime(targetSeconds);
    }
  }

  requestAnimationFrame(tick);
}

async function handleTaskCompleted() {
  const task = getCurrentTask();
  if (!task || !task.id || !username) return;

  try {
    await updateTask(username, task.id, {
      isCompleted: true,
      remainingSeconds: 0,
    });

    // update local state
    task.isCompleted = true;
    tasks = tasks.filter((t) => t.id !== task.id);

    if (tasks.length === 0) {
      // All done UI
      if (main) {
        const span = main.querySelector(".spanimate");
        if (span) {
          span.textContent = "All tasks completed.";
        } else {
          main.textContent = "All tasks completed.";
        }
      }
      if (startBtn) startBtn.textContent = "Start";
      timerRunning = false;

      fullSpan = FULL_ARC_SPAN;
      currentEndAngle = startAngle + FULL_ARC_SPAN;
      drawArcPath(arc, currentEndAngle);
      timeText.textContent = "0:00";
    } else {
      // Rebuild stack from remaining tasks
      stack.setTasks(tasks);
      setupTimerForCurrentTask();
      animateArcReverse(500);
    }
  } catch (err) {
    console.error("Failed to mark task completed:", err);
  }
}

function animateArcToZero() {
  if (totalSeconds <= 0) {
    timeText.textContent = "0:00";
    return;
  }

  const duration = totalSeconds * 1000;
  let startTime = null;
  const initialSeconds = totalSeconds;
  const startSpan = currentEndAngle - startAngle;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    if (!timerRunning) {
      // paused
      return;
    }

    const elapsed = timestamp - startTime;
    const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

    currentEndAngle = startAngle + startSpan * (1 - t);
    drawArcPath(arc, currentEndAngle);

    totalSeconds = Math.max(0, Math.round(initialSeconds * (1 - t)));
    timeText.textContent = formatTime(totalSeconds);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      totalSeconds = 0;
      timeText.textContent = formatTime(0);
      timerRunning = false;
      handleTaskCompleted();
    }
  }

  requestAnimationFrame(tick);
}

// ----------------------
// Events
// ----------------------

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!tasks.length) return;
    stack.animateToNext();
  });
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (!tasks.length) return;

    if (timerRunning) {
      pauseTimer();
      startBtn.textContent = "Start";
    } else {
      timerRunning = true;
      startBtn.textContent = "Pause";
      animateArcToZero();
    }
  });
}

// Optional: clicking the timer section could also move to next or something
if (section) {
  section.addEventListener("click", () => {
    // no-op for now or hook up future behavior
  });
}

// ----------------------
// Load tasks from API
// ----------------------

async function loadTasks() {
  if (!username) return;

  try {
    const allTasks = await getTasks(username);
    // Only active tasks for home screen
    tasks = (allTasks || []).filter((t) => !t.isCompleted);

    if (tasks.length < 1) {
      if (main) {
        const span = main.querySelector(".spanimate");
        if (span) {
          span.textContent = "No tasks found.";
        } else {
          main.textContent = "No tasks found.";
        }
      }
      totalSeconds = 0;
      timeText.textContent = formatTime(0);
      fullSpan = FULL_ARC_SPAN;
      currentEndAngle = startAngle + FULL_ARC_SPAN;
      drawArcPath(arc, currentEndAngle);
      return;
    }

    stack.setTasks(tasks);
    setupTimerForCurrentTask();
    animateArcReverse(500);
  } catch (err) {
    console.error(err);
    if (debug) {
      debug.textContent = `Error: ${err}`;
    }
  }
}

// Initial load
loadTasks();
