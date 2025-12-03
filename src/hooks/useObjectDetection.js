/**
 * Custom hook for object detection using ONNX Runtime
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadModel, runInference, warmupModel, initializeORT } from '../utils/modelLoader';
import { preprocessImage } from '../utils/preprocessing';
import { processOutput, scaleDetections } from '../utils/postprocessing';
import { MODEL_CONFIG, COCO_CLASSES } from '../utils/constants';

export function useObjectDetection() {
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(0);
  const [detections, setDetections] = useState([]);
  const [executionProvider, setExecutionProvider] = useState('wasm');
  
  const animationFrameRef = useRef(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });

  // Initialize ONNX Runtime and load model
  const initializeModel = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize ONNX Runtime
      const provider = await initializeORT();
      setExecutionProvider(provider);

      // Load the model
      const session = await loadModel(MODEL_CONFIG.modelPath, provider);
      
      // Warm up the model
      await warmupModel(session, [1, 3, MODEL_CONFIG.inputWidth, MODEL_CONFIG.inputHeight]);
      
      setModel(session);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize model:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  // Run detection on a single frame
  const detectObjects = useCallback(async (videoElement) => {
    if (!model || !videoElement) {
      console.log('No model or video element');
      return [];
    }

    // Make sure video has valid dimensions
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      console.log('Video not ready - no dimensions');
      return [];
    }

    try {
      // Preprocess image
      const { tensor, scale, offsetX, offsetY } = preprocessImage(
        videoElement,
        MODEL_CONFIG.inputWidth,
        MODEL_CONFIG.inputHeight
      );

      // Run inference
      const output = await runInference(
        model,
        tensor,
        [1, 3, MODEL_CONFIG.inputWidth, MODEL_CONFIG.inputHeight]
      );

      console.log('Output shape:', output.length, 'Expected:', 84 * 8400);
      console.log('First few values:', Array.from(output.slice(0, 10)));

      // Process output
      const rawDetections = processOutput(
        output,
        MODEL_CONFIG.inputWidth,
        MODEL_CONFIG.inputHeight,
        MODEL_CONFIG.confidenceThreshold,
        MODEL_CONFIG.iouThreshold,
        COCO_CLASSES
      );

      console.log('Raw detections:', rawDetections.length);

      // Scale detections back to video coordinates
      const scaledDetections = scaleDetections(
        rawDetections,
        scale,
        offsetX,
        offsetY,
        videoElement.videoWidth,
        videoElement.videoHeight
      );

      console.log('Scaled detections:', scaledDetections.length);

      return scaledDetections;
    } catch (err) {
      console.error('Detection error:', err);
      return [];
    }
  }, [model]);

  // Start continuous detection loop
  const startDetection = useCallback((videoElement) => {
    if (!model || !videoElement) return;
    
    // Prevent multiple loops
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsRunning(true);
    fpsCounterRef.current = { frames: 0, lastTime: performance.now() };
    
    let isActive = true;

    const detectLoop = async () => {
      if (!isActive) return;

      try {
        // Run detection
        const dets = await detectObjects(videoElement);
        setDetections(dets);
        
        console.log(`Frame detected: ${dets.length} objects`);

        // Update FPS
        fpsCounterRef.current.frames++;
        const now = performance.now();
        const elapsed = now - fpsCounterRef.current.lastTime;

        if (elapsed >= 1000) {
          const currentFps = (fpsCounterRef.current.frames * 1000) / elapsed;
          setFps(Math.round(currentFps));
          fpsCounterRef.current.frames = 0;
          fpsCounterRef.current.lastTime = now;
        }

        // Schedule next frame
        animationFrameRef.current = requestAnimationFrame(detectLoop);
      } catch (err) {
        console.error('Detection loop error:', err);
        isActive = false;
        setIsRunning(false);
      }
    };

    detectLoop();
    
    // Store cleanup function
    return () => {
      isActive = false;
    };
  }, [model, detectObjects]);

  // Stop detection loop
  const stopDetection = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDetections([]);
    setFps(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    model,
    isLoading,
    error,
    isRunning,
    fps,
    detections,
    executionProvider,
    initializeModel,
    detectObjects,
    startDetection,
    stopDetection,
  };
}
