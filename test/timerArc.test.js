import { drawArcPath, createArcTimer } from "../js/core/timerArc.js";

QUnit.module("timerArc.js", function (hooks) {
  let originalRAF;

  hooks.beforeEach(function () {
    document.getElementById("qunit-fixture").innerHTML = `
      <svg width="300" height="300">
        <path id="arc"></path>
      </svg>
      <div id="time"></div>
    `;
  });

  hooks.afterEach(function () {
    if (originalRAF) {
      window.requestAnimationFrame = originalRAF;
      originalRAF = null;
    }
  });

  QUnit.test("drawArcPath sets an SVG path 'd' attribute", function (assert) {
    const arc = document.getElementById("arc");

    drawArcPath(arc, 120);

    const d = arc.getAttribute("d");
    assert.ok(d, "d attribute exists");
    assert.ok(d.includes("M"), "contains move command");
    assert.ok(d.includes("A"), "contains arc command");
  });

  QUnit.test("createArcTimer.setTask updates timeElement and arc path", function (assert) {
    const arc = document.getElementById("arc");
    const timeEl = document.getElementById("time");

    const timer = createArcTimer({
      arcElement: arc,
      timeElement: timeEl,
      onComplete: () => {},
    });

    timer.setTask(65, 120);

    assert.equal(timeEl.textContent, "1:05", "time text updated to mm:ss");

    const d = arc.getAttribute("d");
    assert.ok(d && d.includes("A"), "arc path updated");
  });

  QUnit.test("start counts down and calls onComplete (RAF stub)", async function (assert) {
    assert.expect(4);

    const arc = document.getElementById("arc");
    const timeEl = document.getElementById("time");

    let completed = 0;

    // We simulate 0ms then 1000ms, which completes a 1-second timer.
    originalRAF = window.requestAnimationFrame;
    const frames = [0, 1000, 2000];
    window.requestAnimationFrame = (cb) => {
      const ts = frames.shift();
      if (ts === undefined) return 0;
      setTimeout(() => cb(ts), 0);
      return 0;
    };

    const timer = createArcTimer({
      arcElement: arc,
      timeElement: timeEl,
      onComplete: () => {
        completed += 1;
      },
    });

    timer.setTask(1, 1); // 1 second remaining, 1 second duration
    assert.equal(timeEl.textContent, "0:01", "initial time is 0:01");

    timer.start();
    assert.ok(timer.isRunning(), "timer started running");

    await new Promise((r) => setTimeout(r, 20));

    assert.equal(timer.getRemainingSeconds(), 0, "remaining seconds hits 0");
    assert.equal(completed, 1, "onComplete called once");
  });

  QUnit.test("pause prevents completion (RAF stub)", async function (assert) {
    assert.expect(2);

    const arc = document.getElementById("arc");
    const timeEl = document.getElementById("time");

    let completed = 0;

    originalRAF = window.requestAnimationFrame;
    const frames = [0, 500, 1000, 1500, 2000];
    window.requestAnimationFrame = (cb) => {
      const ts = frames.shift();
      if (ts === undefined) return 0;
      setTimeout(() => cb(ts), 0);
      return 0;
    };

    const timer = createArcTimer({
      arcElement: arc,
      timeElement: timeEl,
      onComplete: () => {
        completed += 1;
      },
    });

    timer.setTask(2, 2);
    timer.start();
    timer.pause();

    await new Promise((r) => setTimeout(r, 30));

    assert.equal(completed, 0, "onComplete not called after pause");
    assert.notEqual(timeEl.textContent, "0:00", "time did not finish to 0:00");
  });
});
