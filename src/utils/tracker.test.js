import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTracker } from './tracker.js';
import { processOutput } from './postprocessing.js';

const box = (x, conf = 0.9, className = 'car') =>
  ({ x, y: 100, width: 80, height: 50, confidence: conf, classId: 2, className });
const FRAME = 33; // ms between updates

// Feed one box per frame at the given x positions; return the visible tracks after each update.
const run = (tracker, xs, mk = (x) => box(x)) => xs.map((x, i) => tracker.update([mk(x, i)], i * FRAME));

test('a box is hidden on its first frame and shown once confirmed', () => {
  const [first, second] = run(createTracker(), [0, 2]);
  assert.equal(first.length, 0);
  assert.equal(second.length, 1);
});

test('ID persists for a moving box; label is the majority class, not the latest', () => {
  const t = createTracker();
  const out = run(t, [0, 20, 40, 60, 80], (x, i) => box(x, 0.9, i === 3 ? 'van' : 'car'));
  assert.equal(new Set(out.slice(1).map(o => o[0].id)).size, 1);
  assert.equal(out[3][0].className, 'car');
});

test('fast mover keeps its ID thanks to velocity prediction', () => {
  // 50px/frame with an 80px box: raw IoU is ~0.23 on the first jump, and the smoothed box
  // lags behind, so without velocity prediction later frames drop under matchIou.
  const out = run(createTracker(), [0, 50, 100, 150, 200, 250, 300, 350]);
  assert.equal(new Set(out.slice(1).map(o => o[0].id)).size, 1);
});

test('predict extrapolates between updates and caps the extrapolation', () => {
  const t = createTracker();
  run(t, [0, 30, 60, 90, 120, 150, 180, 210]); // ~30px per 33ms
  const last = 7 * FRAME;
  const at = (ms) => t.predict(last + ms)[0].x;
  assert.ok(at(16) > at(0) + 5, 'moves forward mid-interval');
  assert.equal(at(500), at(1.5 * FRAME), 'stops after 1.5 intervals');
});

test('low-confidence detections never start a track, and keep one alive only invisibly', () => {
  const t = createTracker({ highThreshold: 0.3 });
  assert.equal(t.update([box(0, 0.2)], 0).length, 0);
  assert.equal(t.update([box(0, 0.2)], FRAME).length, 0);
  t.update([box(0, 0.9)], 2 * FRAME);
  const id = t.update([box(0, 0.9)], 3 * FRAME)[0].id;
  assert.equal(t.update([box(5, 0.15)], 4 * FRAME).length, 0, 'hidden while below the threshold');
  assert.equal(t.update([box(5, 0.9)], 5 * FRAME)[0].id, id, 'same ID when it comes back');
});

test('nothing below the slider value is ever shown', () => {
  const t = createTracker();
  for (let i = 0; i < 3; i++) t.update([box(0, 0.7)], i * FRAME, 0.6);
  assert.equal(t.update([box(0, 0.5)], 3 * FRAME, 0.6).length, 0);
  assert.equal(t.predict(3 * FRAME + 10).length, 0);
  assert.equal(t.update([box(0, 0.7)], 4 * FRAME, 0.6)[0].confidence, 0.7);
});

test('stale track is dropped after maxAge and a new ID is issued', () => {
  const t = createTracker({ maxAge: 2 });
  t.update([box(0)], 0);
  const id = t.update([box(0)], FRAME)[0].id;
  for (let i = 2; i <= 4; i++) t.update([], i * FRAME);
  t.update([box(0)], 5 * FRAME);
  assert.notEqual(t.update([box(0)], 6 * FRAME)[0].id, id);
});

test('processOutput decodes [1, 4+nc+extra, anchors] and ignores extra rows', () => {
  const anchors = 3, nc = 2, extra = 32, rows = 4 + nc + extra;
  const data = new Float32Array(rows * anchors);
  // anchor 1: center (50,60) size 20x10, class 1 score 0.8; extra rows filled with big values
  data[1] = 50; data[anchors + 1] = 60; data[2 * anchors + 1] = 20; data[3 * anchors + 1] = 10;
  data[(4 + 1) * anchors + 1] = 0.8;
  for (let r = 4 + nc; r < rows; r++) data.fill(5, r * anchors, (r + 1) * anchors);
  const dets = processOutput({ data, dims: [1, rows, anchors] }, 0.25, 0.45, ['a', 'b']);
  assert.equal(dets.length, 1);
  assert.deepEqual(dets[0], { x: 40, y: 55, width: 20, height: 10, confidence: dets[0].confidence, classId: 1, className: 'b' });
  assert.ok(Math.abs(dets[0].confidence - 0.8) < 1e-6);
});
