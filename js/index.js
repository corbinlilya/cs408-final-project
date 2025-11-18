
// Initial variables
const cx = 150;
const cy = 150;
const radius = 120;
const startAngle = -90;
let fullSpan = 260.9;   // arc span in degrees
let initialFire = false;
let animating = false;
const TOTAL_SECONDS = 12 * 60 + 41;

const arc = document.getElementById("arc");
const section = document.getElementById("section");
const timeText = document.getElementById("timeText");

// Initial timer text
timeText.textContent = formatTime(TOTAL_SECONDS);

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

/**
 * function: animateList
 * Animates all three list items down one and loops bottom one around to top. 
 */
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
        let newInvisible = main.textContent;
        belowMain.textContent = main.textContent;
        main.textContent = aboveMain.textContent;
        aboveMain.textContent = invisible.textContent;        
        invisible.textContent = newInvisible;

        aboveMain.classList.remove("animateMain");
        main.classList.remove("animateShrink");
        invisible.classList.remove("animateGrow");
        belowMain.classList.remove("animateOut");
    }, 500)
    setTimeout(()=> {
        fullSpan = 359.99;
        animateArcReverse(500);
    }, 600);
}

// Degrees to radians
function deg2rad(deg) {
    return (deg * Math.PI) / 180;
}

document.getElementById("dashboard").addEventListener("click", () => {
    window.location.href = "/dashboard.html";
});

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
            Math.round(TOTAL_SECONDS * (1 - t))
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
    let seconds = ((Math.random() % 0.60) * 100 * 60).toFixed(0); 


    function tick(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const t = Math.min(elapsed / duration, 1); // 0 → 1

        const currentEndAngle = startAngle + fullSpan * t;
        drawArc(currentEndAngle);

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



// draw initial full arc
drawArc(startAngle + fullSpan);
