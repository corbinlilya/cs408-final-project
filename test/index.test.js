 

QUnit.module("pages/index.js", function (hooks) {
  hooks.beforeEach(function () {
    document.getElementById("qunit-fixture").innerHTML = `
      <svg><path id="arc"></path></svg>
      <section id="section"></section>
      <h3 id="timeText"></h3>

      <div id="modal" class="modal hidden"></div>
      <form id="usernameForm"></form>
      <input id="userName" />
      <button id="close" type="button"></button>
      <button id="dashboard" type="button"></button>

      <div id="t0"></div>
      <div id="t1"></div>
      <div id="t2"></div>
      <div id="t3"></div>
    `;
  });

  QUnit.test("module loads without crashing", async function (assert) {
    assert.expect(1);
    await import("../js/pages/index.js"); // adjust path if your tests folder differs
    assert.ok(true, "index.js imported");
  });

  QUnit.test("sanitizeUsername is available and accepts normal values", async function (assert) {
    const mod = await import("../js/pages/index.js");

    // If sanitizeUsername is not exported yet, this will be undefined.
    // Export it like: export function sanitizeUsername(...) { ... }
    assert.ok(typeof mod.sanitizeUsername === "function", "sanitizeUsername exported");

    assert.equal(mod.sanitizeUsername("Corbin"), "Corbin");
    assert.equal(mod.sanitizeUsername("  corbin_123  "), "corbin_123");
  });

  QUnit.test("sanitizeUsername rejects empty/too-long/control chars and normalizes unicode", async function (assert) {
    const { sanitizeUsername } = await import("../js/pages/index.js");

    assert.strictEqual(sanitizeUsername("   "), null);
    assert.strictEqual(sanitizeUsername("a".repeat(41)), null);

    assert.strictEqual(sanitizeUsername("bob\nsmith"), null);
    assert.strictEqual(sanitizeUsername("bob\t"), null);
    assert.strictEqual(sanitizeUsername("bob\u0000"), null);

    assert.equal(sanitizeUsername("Ａlice"), "Alice"); // full-width A -> A
  });
});
