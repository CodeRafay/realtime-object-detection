/**
 * Lightweight ByteTrack-style tracker.
 * Gives each object a stable ID, filters one-frame false positives, stabilizes labels,
 * and predicts where boxes are *between* detections so they can be drawn every display frame.
 *
 * Per update: move every track forward by its velocity, match high-confidence detections to
 * tracks by IoU (greedy), then use low-confidence detections only to keep existing tracks alive
 * (the ByteTrack trick for blur/occlusion). Matching is class-agnostic so a flickering label
 * doesn't reset the ID; the shown label is the class with the most accumulated confidence.
 *
 * shortcut: greedy IoU matching instead of Hungarian + Kalman; fine for tens of
 * objects, upgrade if IDs swap in very dense scenes.
 */

import { calculateIoU } from './postprocessing.js';

export function createTracker({
  highThreshold = 0.4, // detections at/above this can start new tracks
  matchIou = 0.2,      // min IoU between predicted track box and detection (ByteTrack's default)
  maxAge = 15,         // updates a lost track is kept before deletion
  minHits = 2,         // matches needed before a track is shown (drops one-frame false positives)
  alpha = 0.7,         // weight of the new detection in the position update
} = {}) {
  let tracks = [];
  let nextId = 1;
  let lastTime = null;
  let interval = 0; // ms between the last two updates

  function match(dets, canCreate, dt) {
    for (const det of dets) {
      let best = null;
      let bestIou = matchIou;
      for (const t of tracks) {
        if (t.matched) continue;
        const iou = calculateIoU(t, det);
        if (iou > bestIou) {
          bestIou = iou;
          best = t;
        }
      }

      if (best) {
        const nx = alpha * det.x + (1 - alpha) * best.x;
        const ny = alpha * det.y + (1 - alpha) * best.y;
        // best.x is already the predicted position, so the residual corrects the velocity (px/ms)
        if (dt > 0) {
          best.vx += 0.5 * (nx - best.x) / dt;
          best.vy += 0.5 * (ny - best.y) / dt;
        }
        best.x = nx;
        best.y = ny;
        best.width = alpha * det.width + (1 - alpha) * best.width;
        best.height = alpha * det.height + (1 - alpha) * best.height;
        best.confidence = det.confidence;
        best.votes[det.className] = (best.votes[det.className] || 0) + det.confidence;
        best.hits++;
        best.matched = true;
        best.age = 0;
      } else if (canCreate) {
        tracks.push({
          ...det, id: nextId++, vx: 0, vy: 0, age: 0, hits: 1, matched: true,
          votes: { [det.className]: det.confidence },
        });
      }
    }
  }

  let shownThreshold = highThreshold; // threshold from the latest update (the UI slider)
  // Drawn only while the latest score meets the slider; weaker matches keep the ID alive invisibly.
  const visible = (t) => t.matched && t.hits >= minHits && t.confidence >= shownThreshold;
  const label = (t) => Object.entries(t.votes).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

  /**
   * Feed one frame's detections (any confidence >= the low threshold, sorted desc by confidence).
   * @param {Array} detections
   * @param {number} now - timestamp in ms (e.g. performance.now())
   * @param {number} [high] - overrides highThreshold (e.g. from a UI slider)
   * @returns {Array} confirmed tracks seen this update
   */
  function update(detections, now, high = highThreshold) {
    const dt = lastTime === null ? 0 : now - lastTime;
    interval = dt;
    lastTime = now;
    shownThreshold = high;

    for (const t of tracks) {
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.matched = false;
    }

    match(detections.filter(d => d.confidence >= high), true, dt);
    match(detections.filter(d => d.confidence < high), false, dt);

    tracks = tracks.filter(t => t.matched || ++t.age <= maxAge);
    return predict(now);
  }

  /**
   * Confirmed tracks extrapolated to `now`, for drawing between updates.
   * Extrapolation is capped at 1.5x the update interval so boxes don't drift off when detections stall.
   */
  function predict(now) {
    const e = lastTime === null ? 0 : Math.min(now - lastTime, 1.5 * interval);
    return tracks.filter(visible).map(t => ({
      id: t.id,
      x: t.x + t.vx * e,
      y: t.y + t.vy * e,
      width: t.width,
      height: t.height,
      confidence: t.confidence,
      className: label(t),
    }));
  }

  return { update, predict };
}
