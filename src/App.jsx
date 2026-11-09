/**
 * Main App Component
 */

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useCamera } from './hooks/useCamera';
import { useObjectDetection } from './hooks/useObjectDetection';
import CameraView from './components/CameraView';
import Controls from './components/Controls';
import FPSMonitor from './components/FPSMonitor';
import './App.css';

function App() {
  const {
    stream,
    error: cameraError,
    devices,
    selectedDeviceId,
    isInitialized: isCameraInitialized,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    changeCamera,
  } = useCamera();

  const {
    model,
    isLoading: isModelLoading,
    error: modelError,
    isRunning: isDetecting,
    fps,
    detectionCount,
    getTracks,
    threshold,
    setThreshold,
    tier,
    executionProvider,
    initializeModel,
    startDetection,
    stopDetection,
  } = useObjectDetection();

  const [videoFileUrl, setVideoFileUrl] = useState(null);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Free the uploaded file's blob URL when it is replaced or the app unmounts
  useEffect(() => () => videoFileUrl && URL.revokeObjectURL(videoFileUrl), [videoFileUrl]);

  // Restart detection after the video source changes, like camera switching does
  const withDetectionPaused = async (switchSource) => {
    const wasDetecting = isDetecting;
    if (wasDetecting) stopDetection();
    await switchSource();
    if (wasDetecting && model) setTimeout(() => handleStartDetection(), 500);
  };

  const handleVideoFile = (file) => withDetectionPaused(async () => {
    stopCamera();
    const url = URL.createObjectURL(file);
    const video = videoRef.current;
    video.srcObject = null; // srcObject takes precedence over src
    video.src = url;
    video.loop = true;
    setVideoFileUrl(url);
    await video.play().catch(() => {});
  });

  const handleUseCamera = () => withDetectionPaused(async () => {
    const video = videoRef.current;
    video.removeAttribute('src');
    video.load();
    setVideoFileUrl(null);
    await startCamera(selectedDeviceId);
  });

  const handleStartDetection = () => {
    if (videoRef.current && model) {
      startDetection(videoRef.current);
    }
  };

  const handleStopDetection = () => {
    stopDetection();
  };

  const handleLoadModel = async () => {
    await initializeModel();
  };

  const handleChangeCamera = async (deviceId) => {
    const wasDetecting = isDetecting;
    if (wasDetecting) {
      stopDetection();
    }
    await changeCamera(deviceId);
    if (wasDetecting && model) {
      setTimeout(() => handleStartDetection(), 500);
    }
  };

  const handleSwitchCamera = async () => {
    const wasDetecting = isDetecting;
    if (wasDetecting) {
      stopDetection();
    }
    await switchCamera();
    if (wasDetecting && model) {
      setTimeout(() => handleStartDetection(), 500);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎯 Real-Time Object Detection</h1>
        <p className="subtitle">Powered by WebGPU & ONNX Runtime</p>
      </header>

      <main className="app-main">
        <div className="content-wrapper">
          <CameraView 
            videoRef={videoRef}
            stream={stream}
            isFilePlaying={!!videoFileUrl}
            getTracks={getTracks}
            isDetecting={isDetecting}
          />

          <div className="sidebar">
            <Controls
              isModelLoaded={!!model}
              isModelLoading={isModelLoading}
              isDetecting={isDetecting}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onStartDetection={handleStartDetection}
              onStopDetection={handleStopDetection}
              onLoadModel={handleLoadModel}
              onChangeCamera={handleChangeCamera}
              onSwitchCamera={handleSwitchCamera}
              isFilePlaying={!!videoFileUrl}
              onVideoFile={handleVideoFile}
              onUseCamera={handleUseCamera}
              tier={tier}
              onChangeTier={(t) => { stopDetection(); initializeModel(t); }}
              threshold={threshold}
              onChangeThreshold={setThreshold}
            />

            {isDetecting && (
              <FPSMonitor fps={fps} executionProvider={executionProvider} />
            )}

            {(cameraError || modelError) && (
              <div className="error-message">
                <h3>⚠️ Error</h3>
                <p>{cameraError || modelError}</p>
              </div>
            )}

            <div className="info-box">
              <h3>ℹ️ Info</h3>
              <ul>
                <li>Source: {videoFileUrl ? '🎞️ Video file' : isCameraInitialized ? '✓ Camera' : '✗ Inactive'}</li>
                <li>Model: {model ? '✓ Loaded' : '✗ Not loaded'}</li>
                <li>Objects: {detectionCount}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>100% client-side • Zero server • Maximum privacy</p>
        <p className="model-info">
          YOLO26 + YOLOE open-vocabulary models • ByteTrack-style tracking
        </p>
      </footer>

      <Analytics />
    </div>
  );
}

export default App;
