export function formatTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;

  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  const ss = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    const mm = minutes.toString().padStart(2, "0");
    return `${hours}:${mm}:${ss}`; // H:MM:SS
  }

  return `${minutes}:${ss}`;
}


export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hLabel = `${h} hour${h === 1 ? "" : "s"}`;
  const mLabel = `${m} minute${m === 1 ? "" : "s"}`;
  const sLabel = `${s} second${s === 1 ? "" : "s"}`;

  return `${hLabel} ${mLabel} ${sLabel}`;
}

export function parseHumanDuration(str) {
  if (!str) return null;
  const lower = str.toLowerCase();

  const hMatch = lower.match(/(\d+)\s*hour/);
  const mMatch = lower.match(/(\d+)\s*minute/);
  const sMatch = lower.match(/(\d+)\s*second/);

  const h = hMatch ? parseInt(hMatch[1], 10) : 0;
  const m = mMatch ? parseInt(mMatch[1], 10) : 0;
  const s = sMatch ? parseInt(sMatch[1], 10) : 0;

  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) return null;
  return h * 3600 + m * 60 + s;
}

export function parseHmsDuration(str) {
  if (!str) return null;
  const parts = str.split(":").map((p) => p.trim());
  if (parts.length !== 3) return null;

  const [hStr, mStr, sStr] = parts;
  const h = Number(hStr);
  const m = Number(mStr);
  const s = Number(sStr);

  if (
    !Number.isInteger(h) || h < 0 ||
    !Number.isInteger(m) || m < 0 || m > 59 ||
    !Number.isInteger(s) || s < 0 || s > 59
  ) {
    return null;
  }

  return h * 3600 + m * 60 + s;
}
