const { test } = require('node:test');
const assert = require('node:assert/strict');
const { route, travelDuration, Director } = require('../game-motion.js');

function pendingAnimation() {
  let resolve, reject;
  const animation = {
    finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
    cancel() { reject(new Error('Animation cancelled')); },
    finish() { resolve(); }
  };
  return animation;
}

test('movement follows every cell, wraps at start and turns corners', () => {
  assert.deepEqual(route(8, 4), [9, 10, 11, 12]);
  assert.deepEqual(route(38, 4), [39, 0, 1, 2]);
  assert.deepEqual(route(20, 0), []);
  assert.equal(route(0, 40).at(-1), 0);
  assert.equal(route(0, 12).length, 12);
});

test('invalid movement cannot produce unbounded keyframes', () => {
  for (const args of [[-1, 3], [40, 3], [1, -1], [1, Infinity], [1, 1.5], [1, 1000], [0, 1, 0]]) {
    assert.deepEqual(route(...args), []);
  }
});

test('movement has a bounded duration even for long paths', () => {
  assert.equal(travelDuration(3), 240);
  assert.equal(travelDuration(12), 960);
  assert.equal(travelDuration(40), 1000);
});

test('reduced motion skips effects immediately without starting animations', async () => {
  const director = new Director(() => false);
  let started = 0;
  await director.play({ animate() { started++; } }, []);
  assert.equal(started, 0);
  assert.equal(director.active.size, 0);
});

test('missing or unsupported animation APIs never reject or block the flow', async () => {
  const director = new Director();
  await director.play(null, []);
  await director.play({}, []);
  await director.play({ animate() { throw new Error('Unsupported keyframe'); } }, []);
  assert.equal(director.active.size, 0);
});

test('completed effects release animation references and temporary styles', async () => {
  const director = new Director();
  const animation = pendingAnimation();
  const playing = director.play({ animate: () => animation }, []);
  assert.equal(director.active.size, 1);
  animation.finish();
  await playing;
  assert.equal(director.active.size, 0);
});

test('interrupting multiple effects settles their promises so a turn can finish', async () => {
  const director = new Director();
  const first = pendingAnimation(), second = pendingAnimation();
  const promises = [director.play({ animate: () => first }, []), director.play({ animate: () => second }, [])];
  assert.equal(director.active.size, 2);
  director.cancel();
  await Promise.all(promises);
  assert.equal(director.active.size, 0);
});

test('cancelling movement restores the real badge and clears path/ghost nodes', async () => {
  const director = new Director();
  const animation = pendingAnimation();
  const onRoute = new Set();
  let ghostRemoved = false, appended = false;
  const ghost = {
    classList: { add() {} }, style: { setProperty() {} },
    removeAttribute() {}, setAttribute() {},
    animate: () => animation, remove() { ghostRemoved = true; }
  };
  const token = {
    isConnected: true, style: { visibility: '' },
    getBoundingClientRect: () => ({ left: 20, top: 20, width: 12, height: 16 }),
    cloneNode: () => ghost
  };
  const board = {
    offsetWidth: 400,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400 }),
    append() { appended = true; }
  };
  const tiles = Array.from({ length: 40 }, (_, i) => ({ node: {
    getBoundingClientRect: () => ({ left: i * 10, bottom: 100, width: 10 }),
    classList: { add() { onRoute.add(i); }, remove() { onRoute.delete(i); } }
  } }));
  const movement = director.travel(board, token, tiles, [1, 2, 3], '#276b98');
  assert.equal(appended, true);
  assert.equal(token.style.visibility, 'hidden');
  assert.equal(onRoute.size, 3);
  director.cancel();
  await movement;
  assert.equal(token.style.visibility, '');
  assert.equal(onRoute.size, 0);
  assert.equal(ghostRemoved, true);
});
