// js/core/taskStack.js

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
  // reset CSS animation
  el.style.animation = "none";
  void el.offsetWidth; // force reflow
  el.style.animation = "";
}

/**
 * TaskStack controls the four “cards”:
 *  - invisible (upcoming)
 *  - aboveMain
 *  - main
 *  - belowMain
 *
 * It only deals with visual titles, not full task objects.
 */
export function createTaskStack({
  invisible,
  aboveMain,
  main,
  belowMain,
  onMainChanged, // callback: called after main card changes
}) {
  let titles = [];       // array of strings (task.title)
  let invisibleIndex = 0;
  let animating = false;

  function syncInitialPositions() {
    if (!titles.length) {
      // no tasks; leave main alone (home.js can show "No tasks")
      return;
    }

    // Base: all show first task
    setTitleFor(invisible, titles[0]);
    setTitleFor(aboveMain, titles[0]);
    setTitleFor(belowMain, titles[0]);
    setTitleFor(main, titles[0]);
    invisibleIndex = 0;

    if (titles.length >= 2) {
      setTitleFor(belowMain, titles[0]);
      setTitleFor(main, titles[1]);
      setTitleFor(aboveMain, titles[0]);
      invisibleIndex = 0;
    }

    if (titles.length >= 3) {
      setTitleFor(invisible, titles[0]);
      setTitleFor(aboveMain, titles[2]);
      invisibleIndex = 0;
    }

    if (titles.length >= 4) {
      setTitleFor(invisible, titles[3]);
      invisibleIndex = 3;
    }
  }

  /**
   * Public: set the stack's titles from a list of tasks.
   * @param {Array<{ title: string }>} tasks
   */
  function setTasks(tasks) {
    titles = (tasks || []).map((t) => t.title || "(untitled)");
    invisibleIndex = 0;
    syncInitialPositions();
    onMainChanged?.(getCurrentTitle());
  }

  function getCurrentTitle() {
    return getTitleFrom(main);
  }

  function isAnimating() {
    return animating;
  }

  /**
   * Public: animate to the next task in the stack.
   * Home.js should only call this when titles.length > 0.
   */
  function animateToNext() {
    if (animating || !titles.length) return;
    animating = true;

    [invisible, aboveMain, main, belowMain].forEach(resetAnimationClasses);

    aboveMain.classList.add("animateMain");
    main.classList.add("animateShrink");
    belowMain.classList.add("animateOut");
    invisible.classList.add("animateGrow");

    if (titles.length > 2) {
      invisibleIndex++;
    }

    setTimeout(() => {
      const oldMainTitle = getTitleFrom(main);

      // rotate text down
      setTitleFor(belowMain, getTitleFrom(main));
      setTitleFor(main, getTitleFrom(aboveMain));
      setTitleFor(aboveMain, getTitleFrom(invisible));

      if (titles.length > 2) {
        if (invisibleIndex === titles.length) {
          invisibleIndex = 0;
        }
        setTitleFor(invisible, titles[invisibleIndex]);
      } else {
        // with <= 2 titles, just keep the old main as invisible
        setTitleFor(invisible, oldMainTitle);
      }

      aboveMain.classList.remove("animateMain");
      main.classList.remove("animateShrink");
      invisible.classList.remove("animateGrow");
      belowMain.classList.remove("animateOut");

      animating = false;

      // main card changed → tell home.js
      onMainChanged?.(getCurrentTitle());
    }, 500);
  }

  return {
    setTasks,
    animateToNext,
    getCurrentTitle,
    isAnimating,
  };
}
