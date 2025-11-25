// taskStack.test.js
import { createTaskStack } from '../js/core/taskStack.js';

QUnit.module('TaskStack', function (hooks) {
  let invisible, aboveMain, main, belowMain, stack, fixture;

  hooks.beforeEach(function () {
    fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = `
      <div id="t0"><span class="spanimate"></span></div>
      <div id="t1"><span class="spanimate"></span></div>
      <div id="t2"><span class="spanimate"></span></div>
      <div id="t3"><span class="spanimate"></span></div>
    `;

    invisible = document.getElementById('t0');
    aboveMain = document.getElementById('t1');
    main = document.getElementById('t2');
    belowMain = document.getElementById('t3');

    stack = createTaskStack({
      invisible,
      aboveMain,
      main,
      belowMain,
      onMainChanged: () => {},
    });
  });

  QUnit.test('setTasks sets main to first or second task', function (assert) {
    const tasks = [
      { title: 'Task A' },
      { title: 'Task B' },
      { title: 'Task C' },
    ];

    stack.setTasks(tasks);

    const mainTitle = main.querySelector('.spanimate').textContent;
    assert.ok(['Task A', 'Task B'].includes(mainTitle), 'main is set to one of the first tasks');
  });

  QUnit.test('animateToNext cycles main title', function (assert) {
    const done = assert.async();

    const tasks = [
      { title: 'Task A' },
      { title: 'Task B' },
      { title: 'Task C' },
    ];

    stack.setTasks(tasks);

    const before = main.querySelector('.spanimate').textContent;

    stack.animateToNext();

    // animation uses setTimeout(500), so wait a bit longer
    setTimeout(() => {
      const after = main.querySelector('.spanimate').textContent;
      assert.notEqual(after, before, 'main title changed after animateToNext');
      done();
    }, 600);
  });
});
