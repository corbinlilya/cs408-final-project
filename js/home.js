// Get username from search params
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

// Initial variables
const cx = 150;
const cy = 150;
const radius = 120;
const startAngle = -90;
let totalSeconds = 0;
let fullSpan = 359.99;
let initialFire = false;
let animating = false;
let invisibleIndex = 0;
let tasks = [];

const API_BASE = "https://i2sgiec8za.execute-api.us-east-2.amazonaws.com";

// Grab DOM elements
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

const taskList = document.getElementById("section");

manageTasks.addEventListener("click", () => {
  window.location.href = `/tasks.html?user=${encodeURIComponent(username)}`;
});

taskList.addEventListener("click", () => {
  if(animating) return;
  animating = true;
  animateList();
});


// Show username on page
if (username) {
  welcome.textContent = `Username: ${username}`;
} else {
  welcome.textContent = "No selected username (?user=...)";
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
    tasks = data;
    if(data.length >= 1){
      invisible.textContent = aboveMain.textContent = belowMain.textContent = main.textContent = data[0].title;
      totalSeconds = data[0].durationSeconds;
    } else {
      main.textContent = "No Tasks to See"
    }
    if (data.length >= 2){
      belowMain.textContent = data[0].title;
      main.textContent = data[1].title;
      aboveMain.textContent = data[0].title;
      totalSeconds = data[1].durationSeconds;
    }
    if (data.length >= 3){
      invisible.textContent = data[0].title;
      aboveMain.textContent = data[2].title;
    }
    if (data.length >= 4){
      invisible.textContent = data[3].title;
      invisibleIndex = 3;
    }
  } catch (err) {
    console.error(err);
    debug.innerHTML = `<p style="color:red;">${err}</p>`;
  }
}

// Degrees to radians
function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}


/**
 * function: animateList
 * Animates all three list items down one and loops bottom one around to top. 
 */
function animateList() {
  aboveMain.classList.add("animateMain");
  main.classList.add("animateShrink");
  invisible.classList.add("animateGrow");
  belowMain.classList.add("animateOut");

  // Only need index changing if there'
  if(tasks.length > 2 ){
    invisibleIndex++;
  }

  setTimeout(() => {
    let newInvisible = main.textContent;
    belowMain.textContent = main.textContent;
    main.textContent = aboveMain.textContent;
    aboveMain.textContent = invisible.textContent;
    

    if(tasks.length > 2){
      if(invisibleIndex == tasks.length){
        invisibleIndex = 0;
      }
      invisible.textContent = tasks[invisibleIndex].title;
    } else {
      invisible.textContent = newInvisible;
    }

    aboveMain.classList.remove("animateMain");
    main.classList.remove("animateShrink");
    invisible.classList.remove("animateGrow");
    belowMain.classList.remove("animateOut");
    animating = false;
  }, 500)
  setTimeout(() => {
    fullSpan = 359.99;
    totalSeconds = tasks.at(invisibleIndex - 2).durationSeconds;
    animateArcReverse(500);
  }, 600);
}

/**
 * function: drawArc
 * Draws arc timer based on calculated start and end angle.
 * 
 * @param endAngle 
 */
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

/**
 * function: formatTime
 * Formats given seconds in mm:ss
 * 
 * @param {} totalSeconds 
 * @returns formatted time mm:ss 
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * function: animateArcToZero
 * Counts down and animates end angle to start angle.
 * 
 * @param duration 
 */
function animateArcToZero(duration = 1000) {
  let startTime = null;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    const t = Math.min(elapsed / duration, 1); // progress 0 → 1

    const currentEndAngle = (startAngle + fullSpan) - fullSpan * t;
    drawArc(currentEndAngle);

    const remainingSeconds = Math.max(
      0,
      Math.round(totalSeconds * (1 - t))
    );
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

/**
 * function: animateArcReverse
 * Animates arc path to full arc. 
 * 
 * @param duration 
 */
function animateArcReverse(duration = 1500) {
  let startTime = null;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    const t = Math.min(elapsed / duration, 1); // 0 → 1

    const currentEndAngle = startAngle + fullSpan * t;
    drawArc(currentEndAngle);

    const currentSeconds = Math.round(totalSeconds * t);
    timeText.textContent = formatTime(currentSeconds);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      timeText.textContent = formatTime(currentSeconds);
    }
  }

  requestAnimationFrame(tick);
}

animateArcReverse(500);
loadTasks();