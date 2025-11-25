import { ARC_CONFIG } from "./config.js";
import { formatTime } from "./time.js";

function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

export function drawArcPath(arcElement, endAngle) {
  const { cx, cy, radius, startAngle } = ARC_CONFIG;

  const startX = cx + radius * Math.cos(deg2rad(startAngle));
  const startY = cy + radius * Math.sin(deg2rad(startAngle));

  const endX = cx + radius * Math.cos(deg2rad(endAngle));
  const endY = cy + radius * Math.sin(deg2rad(endAngle));

  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  const d = `
    M ${startX} ${startY}
    A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}
  `;
  arcElement.setAttribute("d", d);
}

/**
 * Creates a timer controller that owns the countdown + arc animation
 * but lets the page decide what happens when the timer finishes.
 */
export function createArcTimer({ arcElement, timeElement, onComplete }) {
  const { startAngle, fullArcSpan } = ARC_CONFIG;

  let currentEndAngle = startAngle;
  let totalSeconds = 0;
  let durationSeconds = 0;
  let running = false;

  function setTask(secondsRemaining, duration) {
    durationSeconds = duration ?? secondsRemaining;
    totalSeconds = secondsRemaining;

    const ratio = durationSeconds > 0
      ? Math.max(0, Math.min(1, totalSeconds / durationSeconds))
      : 0;

    const span = fullArcSpan * ratio;
    currentEndAngle = startAngle + span;
    drawArcPath(arcElement, currentEndAngle);
    timeElement.textContent = formatTime(totalSeconds);
  }

  function pause() {
    running = false;
  }

  function start() {
    if (running || totalSeconds <= 0) return;
    running = true;
    const startSpan = currentEndAngle - startAngle;
    const initialSeconds = totalSeconds;
    const durationMs = initialSeconds * 1000;
    let startTime = null;

    function tick(timestamp) {
      if (!startTime) startTime = timestamp;
      if (!running) return;

      const elapsed = timestamp - startTime;
      const t = durationMs > 0 ? Math.min(elapsed / durationMs, 1) : 1;

      currentEndAngle = startAngle + startSpan * (1 - t);
      drawArcPath(arcElement, currentEndAngle);

      totalSeconds = Math.max(0, Math.round(initialSeconds * (1 - t)));
      timeElement.textContent = formatTime(totalSeconds);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        running = false;
        totalSeconds = 0;
        timeElement.textContent = formatTime(0);
        onComplete?.();
      }
    }

    requestAnimationFrame(tick);
  }

  return {
    setTask,
    start,
    pause,
    isRunning: () => running,
    getRemainingSeconds: () => totalSeconds,
  };
}
