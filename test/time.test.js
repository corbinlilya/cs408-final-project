// time.test.js
import {
  formatTime,
  formatDuration,
  parseHmsDuration,
  parseHumanDuration,
} from '../js/core/time.js';

QUnit.module('time helpers', function () {
  QUnit.test('formatTime formats seconds as mm:ss', function (assert) {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(5), '0:05');
    assert.equal(formatTime(65), '1:05');
    assert.equal(formatTime(600), '10:00');
  });

  QUnit.test('formatDuration formats to hours/minutes/seconds', function (assert) {
    assert.equal(
      formatDuration(0),
      '0 hours 0 minutes 0 seconds'
    );
    assert.equal(
      formatDuration(65),
      '0 hours 1 minute 5 seconds'
    );
    assert.equal(
      formatDuration(3600),
      '1 hour 0 minutes 0 seconds'
    );
    assert.equal(
      formatDuration(3661),
      '1 hour 1 minute 1 second'
    );
  });

  QUnit.test('parseHmsDuration parses HH:MM:SS into seconds', function (assert) {
    assert.equal(parseHmsDuration('00:00:00'), 0);
    assert.equal(parseHmsDuration('00:01:05'), 65);
    assert.equal(parseHmsDuration('01:00:00'), 3600);
    assert.strictEqual(parseHmsDuration('bad'), null);
    assert.strictEqual(parseHmsDuration('10:99:00'), null, 'invalid minutes');
  });

  QUnit.test('parseHumanDuration parses "X hours Y minutes Z seconds"', function (assert) {
    assert.equal(parseHumanDuration('1 hour 2 minutes 3 seconds'), 3723);
    assert.equal(parseHumanDuration('2 hours'), 7200);
    assert.equal(parseHumanDuration('45 minutes'), 2700);
    assert.strictEqual(parseHumanDuration('nonsense'), 0);
  });
});
