// tasksApi.test.js
import { getTasks, createTask, updateTask, deleteTask } from '../js/core/tasksApi.js';

QUnit.module('tasksApi', function (hooks) {
  let originalFetch;

  hooks.beforeEach(function () {
    originalFetch = window.fetch;
  });

  hooks.afterEach(function () {
    window.fetch = originalFetch;
  });

  QUnit.test('getTasks calls correct URL and returns parsed JSON', async function (assert) {
    assert.expect(3);

    const fakeTasks = [{ id: '1', title: 'Test Task' }];

    window.fetch = (url) => {
      assert.ok(url.includes('/users/testuser/tasks'), 'URL includes username and tasks path');

      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(fakeTasks)),
      });
    };

    const result = await getTasks('testuser');
    assert.ok(Array.isArray(result), 'Result is an array');
    assert.equal(result[0].title, 'Test Task', 'Parsed JSON content is correct');
  });

  QUnit.test('createTask sends POST with JSON body', async function (assert) {
    assert.expect(3);

    const newTask = { id: '1', title: 'New Task' };

    window.fetch = (url, options) => {
      assert.ok(url.includes('/users/testuser/tasks'), 'POST url includes tasks path');
      assert.equal(options.method, 'POST', 'Method is POST');
      assert.equal(
        options.headers['Content-Type'],
        'application/json',
        'Content-Type is JSON'
      );
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });
    };

    await createTask('testuser', newTask);
  });
});
