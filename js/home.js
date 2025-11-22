// ==============================
// Config & Global State
// ==============================

// Get username from search params
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

// Timer / arc stats
const cx = 150;
const cy = 150;
const radius = 120;
const startAngle = -90;
const FULL_ARC_SPAN = 359.99; // full circle span

let currentEndAngle = startAngle; // where the arc currently ends
let fullSpan = 0;                 // current arc span (depends on remaining/duration)
let totalSeconds = 0;             // remainingSeconds for current task
let currentDurationSeconds = 0;   // durationSeconds for current task

let invisibleIndex = 0;
let timerRunning = false;
let animating = false;

let tasks = [];

const API_BASE = "https://i2sgiec8za.execute-api.us-east-2.amazonaws.com";



// DOM References
const welcome = document.getElementById("welcome");
const form = document.getElementById("taskForm");
const input = document.getElementById("taskName");
const manageTasks = document.getElementById("manageTasks");

const arc = document.getElementById("arc");
const section = document.getElementById("section");
const timeText = document.getElementById("timeText");

const invisible = document.getElementById("t0");
const aboveMain = document.getElementById("t1");
const main = document.getElementById("t2");
const belowMain = document.getElementById("t3");

const start = document.getElementById("start");
const next = document.getElementById("next");

const debug = document.getElementById("debug");


// Initial UI Setup

// Show username on page
if (username) {
  welcome.textContent = `Username: ${username}`;
} else {
  welcome.textContent = "No selected username (?user=...)";
}

// Navigate to full task list
manageTasks.addEventListener("click", () => {
  window.location.href = `/tasks.html?user=${encodeURIComponent(username)}`;
});

// Utility Functions
function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

function formatTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function drawArc(endAngle) {
  const startX = cx + radius * Math.cos(deg2rad(startAngle));
  const startY = cy + radius * Math.sin(deg2rad(startAngle));

  const endX = cx + radius * Math.cos(deg2rad(endAngle));
  const endY = cy + radius * Math.sin(deg2rad(endAngle));

  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  const d = `
    M ${startX} ${startY}
    A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}
  `;

  arc.setAttribute("d", d);
}

function getTitleFrom(el) {
  const span = el.querySelector(".spanimate");
  return span ? span.textContent : el.textContent;
}

function setTitleFor(el, title) {
  const span = el.querySelector(".spanimate");
  if (span) {
    span.textContent = title;
  } else {
    el.textContent = title;
  }
}

function resetAnimationClasses(el) {
  if (!el) return;
  el.classList.remove(
    "animateMain",
    "animateShrink",
    "animateGrow",
    "animateOut",
    "moveOff",
    "moveIn"
  );
  // Reset animation so it can restart
  el.style.animation = "none";
  // Force reflow so the browser acknowledges the reset
  void el.offsetWidth;
  el.style.animation = "";
}


function getCurrentTask() {
  if (!tasks || tasks.length === 0) return null;
  const currentTitle = getTitleFrom(main);
  return tasks.find((t) => t.title === currentTitle) ?? null;
}

// Compute timer and arc from current main task (duration + remaining)
function setupTimerForCurrentTask() {
  const task = getCurrentTask();

  if (!task) {
    totalSeconds = 0;
    currentDurationSeconds = 0;
    fullSpan = 0;
    currentEndAngle = startAngle;
    drawArc(currentEndAngle);
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
  drawArc(currentEndAngle);
  timeText.textContent = formatTime(totalSeconds);
}

/**
 * Save remainingSeconds for the current main task to AWS
 */
async function saveTimerState() {
  if (!username) return;

  const task = getCurrentTask();
  if (!task || !task.id) return;

  try {
    await fetch(
      `${API_BASE}/users/${encodeURIComponent(
        username
      )}/tasks/${encodeURIComponent(task.id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remainingSeconds: totalSeconds,
        }),
      }
    );

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

  const targetSpan = fullSpan; // span corresponding to remaining/duration
  const targetSeconds = totalSeconds;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

    currentEndAngle = startAngle + targetSpan * t;
    drawArc(currentEndAngle);

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


async function toggleCompletedForCurrentTask() {
  if (!username) return;

  const currentTask = getCurrentTask();
  if (!currentTask) return;

  const updatedTask = {
    ...currentTask,
    isCompleted: !currentTask.isCompleted,
    remainingSeconds: 0,
  };

  try {
    await fetch(
      `${API_BASE}/users/${encodeURIComponent(username)}/tasks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      }
    );

    // update local copy so it's in sync this session
    currentTask.isCompleted = updatedTask.isCompleted;
    currentTask.remainingSeconds = 0;
  } catch (err) {
    console.error("Failed to toggle isCompleted:", err);
  }
}


function animateArcToZero() {
  if (totalSeconds <= 0) {
    timeText.textContent = "0:00";
    return;
  }

  const duration = totalSeconds * 1000; // ms for remaining time
  let startTime = null;

  const initialSeconds = totalSeconds;
  const startSpan = currentEndAngle - startAngle; // span representing remaining

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    if (!timerRunning) {
      // paused; stop animation here – arc + totalSeconds already at paused point
      return;
    }

    const elapsed = timestamp - startTime;
    const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

    // currentEndAngle goes from current → startAngle
    currentEndAngle = startAngle + startSpan * (1 - t);
    drawArc(currentEndAngle);

    totalSeconds = Math.max(0, Math.round(initialSeconds * (1 - t)));
    timeText.textContent = formatTime(totalSeconds);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      totalSeconds = 0;
      timeText.textContent = formatTime(0);
      timerRunning = false;
      toggleCompletedForCurrentTask();
      console.log(tasks.length);

      if (tasks.length === 2 || tasks.length === 1) {
        console.log("HERE!");
        const aboveSpan = aboveMain.querySelector(".spanimate");
        const mainSpan = main.querySelector(".spanimate");
        const belowSpan = belowMain.querySelector(".spanimate");

        aboveSpan.classList.add("moveOff");
        mainSpan.classList.add("moveOff");
        belowSpan.classList.add("moveOff");

        mainSpan.classList.remove("moveOff");
        mainSpan.textContent = "All tasks completed.";
        mainSpan.classList.add("moveIn");
        start.textContent = "Start";
        tasks = [];

        // Make arc full when everything is done
        fullSpan = FULL_ARC_SPAN;
        currentEndAngle = startAngle + FULL_ARC_SPAN;
        drawArc(currentEndAngle);
      } else {
        animateList();
      }
    }
  }

  requestAnimationFrame(tick);
}


// Task Stack Animation
function animateList() {
  [invisible, aboveMain, main, belowMain].forEach(resetAnimationClasses);

  aboveMain.classList.add("animateMain");
  main.classList.add("animateShrink");
  belowMain.classList.add("animateOut");

  // When an invisible element upcoming is actually an old completed, take it out and replace it with the item next up.
  const invTitle = getTitleFrom(invisible);
  const invTask = tasks.find(t => t.title === invTitle);
  if (invTask && invTask.isCompleted) {
    tasks = tasks.filter(t => !t.isCompleted);
    invisibleIndex--;
    invisible.textContent = tasks.at(invisibleIndex).title;
  }
  invisible.classList.add("animateGrow");

  if (tasks.length > 2) {
    invisibleIndex++;
  }

  setTimeout(() => {
    let newInvisible = getTitleFrom(main);

    setTitleFor(belowMain, getTitleFrom(main));
    setTitleFor(main, getTitleFrom(aboveMain));
    setTitleFor(aboveMain, getTitleFrom(invisible));

    if (tasks.length > 2) {
      if (invisibleIndex === tasks.length) {
        invisibleIndex = 0;
      }
      setTitleFor(invisible, tasks[invisibleIndex].title);
    } else {
      setTitleFor(invisible, newInvisible);
    }

    aboveMain.classList.remove("animateMain");
    main.classList.remove("animateShrink");
    invisible.classList.remove("animateGrow");
    belowMain.classList.remove("animateOut");
    animating = false;
  }, 500);

  setTimeout(() => {
    timerRunning = false;
    start.textContent = "Start";
    setupTimerForCurrentTask();   // compute new remaining/duration + arc span
    animateArcReverse(500);       // animate from 0 → remaining ratio
  }, 600);
}


// Event Listeners
next.addEventListener("click", () => {
  if (animating) return;
  if (tasks.length === 0) return;
  animating = true;
  animateList();
});

start.addEventListener("click", () => {
  if (!tasks.length) return;

  if (timerRunning) {
    pauseTimer();
    start.textContent = "Start";
  } else {
    timerRunning = true;
    start.textContent = "Pause";
    animateArcToZero();
  }
});


// API: Load Tasks
async function loadTasks() {
  if (!username) return;

  try {
    const res = await fetch(
      `${API_BASE}/users/${encodeURIComponent(username)}/tasks`
    );

    const text = await res.text();
    if (!res.ok) {
      if (debug) debug.textContent = `GET ${res.status}: ${text}`;
      return;
    }

    const data = JSON.parse(text);
    tasks = data;

    if (tasks.length < 1) {
      setTitleFor(main, "No tasks found.");
      totalSeconds = 0;
      timeText.textContent = formatTime(0);
      fullSpan = FULL_ARC_SPAN;
      currentEndAngle = startAngle + FULL_ARC_SPAN;
      drawArc(currentEndAngle);
      return;
    }

    // Base: all show first task
    setTitleFor(invisible, tasks[0].title);
    setTitleFor(aboveMain, tasks[0].title);
    setTitleFor(belowMain, tasks[0].title);
    setTitleFor(main, tasks[0].title);
    invisibleIndex = 0;

    if (tasks.length >= 2) {
      setTitleFor(belowMain, tasks[0].title);
      setTitleFor(main, tasks[1].title);
      setTitleFor(aboveMain, tasks[0].title);
      invisibleIndex = 0;
    }

    if (tasks.length >= 3) {
      setTitleFor(invisible, tasks[0].title);
      setTitleFor(aboveMain, tasks[2].title);
      invisibleIndex = 0;
    }

    if (tasks.length >= 4) {
      setTitleFor(invisible, tasks[3].title);
      invisibleIndex = 3;
    }

    setupTimerForCurrentTask();
    animateArcReverse(500);

  } catch (err) {
    console.error(err);
    if (debug) debug.textContent = `Error: ${err}`;
  }
}

// Initial load
loadTasks();
