/**
 * Main App Component
 */

import { useEffect } from 'react';
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
    detections,
    executionProvider,
    initializeModel,
    startDetection,
    stopDetection,
  } = useObjectDetection();

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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
            detections={detections}
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
                <li>Camera: {isCameraInitialized ? '✓ Active' : '✗ Inactive'}</li>
                <li>Model: {model ? '✓ Loaded' : '✗ Not loaded'}</li>
                <li>Detections: {detections.length}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>100% client-side • Zero server • Maximum privacy</p>
        <p className="model-info">
          Place <code>yolov8n.onnx</code> in <code>/public/models/</code> directory
        </p>
      </footer>

      <Analytics />
    </div>
  );
}

export default App;
