/**
 * Custom hook for object detection + tracking using ONNX Runtime
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadModel, releaseModel, runInference, warmupModel } from '../utils/modelLoader';
import { preprocessImage } from '../utils/preprocessing';
import { processOutput, scaleDetections } from '../utils/postprocessing';
import { createTracker } from '../utils/tracker';
import { MODEL_CONFIG, MODELS, COCO_CLASSES } from '../utils/constants';

const inputShape = (cfg) => [1, 3, cfg.inputHeight, cfg.inputWidth];

async function loadLabels(path) {
  if (!path) return COCO_CLASSES;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}

/** Load a tier, compile its GPU shaders, and measure its average inference time on this device. */
async function loadTier(tier) {
  const cfg = MODELS[tier];
  const [{ session, provider }, labels] = await Promise.all([loadModel(cfg.path), loadLabels(cfg.labelsPath)]);
  await warmupModel(session, inputShape(cfg)); // first run compiles shaders; not representative
  const zeros = new Float32Array(3 * cfg.inputWidth * cfg.inputHeight);
  const t0 = performance.now();
  for (let i = 0; i < 3; i++) await runInference(session, zeros, inputShape(cfg));
  return { session, provider, cfg, tier, labels, ms: (performance.now() - t0) / 3 };
}

export function useObjectDetection() {
  const [model, setModel] = useState(null); // { session, provider, cfg, tier, labels, ms }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);
  const [threshold, setThresholdState] = useState(MODEL_CONFIG.confidenceThreshold);

  // Incremented on every start/stop; a loop iteration exits if its id is stale.
  const loopIdRef = useRef(0);
  const trackerRef = useRef(null);
  const modelRef = useRef(null); // current model, so the previous one can be released exactly once
  const thresholdRef = useRef(threshold); // read by the running loop without restarting it

  const setThreshold = useCallback((value) => {
    thresholdRef.current = value;
    setThresholdState(value);
  }, []);

  // Boxes extrapolated to `now`; the canvas calls this every display frame (no React re-render).
  const getTracks = useCallback((now) => trackerRef.current?.predict(now) ?? [], []);

  /**
   * Load a model tier. Without a tier: load Fast, and switch to Accurate if this device runs Fast
   * quickly enough that Accurate will still be real-time.
   */
  const initializeModel = useCallback(async (tier) => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await loadTier(tier ?? 'fast');
      let chosen = loaded;
      if (!tier && loaded.ms < MODEL_CONFIG.autoUpgradeMs) {
        chosen = await loadTier('accurate');
        releaseModel(loaded.session);
      }
      console.log(`✓ Using ${chosen.cfg.label} model (${chosen.ms.toFixed(0)} ms/frame on ${chosen.provider})`);
      const old = modelRef.current;
      modelRef.current = chosen;
      setModel(chosen);
      if (old) releaseModel(old.session); // queued after any frame still inferring on it
    } catch (err) {
      console.error('Failed to initialize model:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run detection on a single frame (returns untracked, scaled detections)
  const detectObjects = useCallback(async (videoElement) => {
    if (!model || !videoElement?.videoWidth || !videoElement.videoHeight) return [];

    const { session, cfg, labels } = model;
    try {
      const { tensor, scale, offsetX, offsetY } = preprocessImage(videoElement, cfg.inputWidth, cfg.inputHeight);
      const output = await runInference(session, tensor, inputShape(cfg));
      const raw = processOutput(
        output,
        MODEL_CONFIG.lowConfidenceThreshold,
        MODEL_CONFIG.iouThreshold,
        labels,
        MODEL_CONFIG.maxDetections
      );
      return scaleDetections(raw, scale, offsetX, offsetY, videoElement.videoWidth, videoElement.videoHeight);
    } catch (err) {
      console.error('Detection error:', err);
      return [];
    }
  }, [model]);

  const startDetection = useCallback((videoElement) => {
    if (!model || !videoElement) return;

    const loopId = ++loopIdRef.current;
    const tracker = createTracker();
    trackerRef.current = tracker;
    let frames = 0;
    let lastTime = performance.now();
    // requestVideoFrameCallback fires once per new video frame, so no frame is processed twice.
    const nextFrame = videoElement.requestVideoFrameCallback
      ? (cb) => videoElement.requestVideoFrameCallback(cb)
      : (cb) => requestAnimationFrame(cb);

    setIsRunning(true);

    const detectLoop = async () => {
      if (loopIdRef.current !== loopId) return;

      const dets = await detectObjects(videoElement);
      if (loopIdRef.current !== loopId) return; // stopped while inferring
      const now = performance.now();
      const visible = tracker.update(dets, now, thresholdRef.current);

      frames++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        setDetectionCount(visible.length);
        frames = 0;
        lastTime = now;
      }

      nextFrame(detectLoop);
    };

    detectLoop();
  }, [model, detectObjects]);

  const stopDetection = useCallback(() => {
    loopIdRef.current++;
    trackerRef.current = null;
    setIsRunning(false);
    setDetectionCount(0);
    setFps(0);
  }, []);

  // Stop the loop on unmount
  useEffect(() => () => { loopIdRef.current++; }, []);

  return {
    model,
    isLoading,
    error,
    isRunning,
    fps,
    detectionCount,
    getTracks,
    threshold,
    setThreshold,
    executionProvider: model?.provider ?? 'wasm',
    tier: model?.tier ?? null,
    initializeModel,
    detectObjects,
    startDetection,
    stopDetection,
  };
}
