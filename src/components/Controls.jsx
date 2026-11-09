/**
 * Controls Component
 * Start/Stop detection, camera switching, and settings
 */

import { useRef } from 'react';
import { MODELS } from '../utils/constants';
import './Controls.css';

export default function Controls({
  isModelLoaded,
  isModelLoading,
  isDetecting,
  devices,
  selectedDeviceId,
  onStartDetection,
  onStopDetection,
  onLoadModel,
  onChangeCamera,
  onSwitchCamera,
  isFilePlaying,
  onVideoFile,
  onUseCamera,
  tier,
  onChangeTier,
  threshold,
  onChangeThreshold,
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="controls">
      <div className="controls-section">
        <h3>Model</h3>
        {!isModelLoaded && !isModelLoading && (
          <button onClick={onLoadModel} className="btn-primary">
            Load Model
          </button>
        )}
        {isModelLoading && (
          <button className="btn-disabled" disabled>
            Loading Model...
          </button>
        )}
        {isModelLoaded && !isDetecting && !isModelLoading && (
          <button onClick={onStartDetection} className="btn-success">
            Start Detection
          </button>
        )}
        {isModelLoaded && isDetecting && (
          <button onClick={onStopDetection} className="btn-danger">
            Stop Detection
          </button>
        )}
        {isModelLoaded && (
          <>
            <label className="help-text" htmlFor="tier-select">Quality</label>
            <select
              id="tier-select"
              value={tier}
              disabled={isModelLoading}
              onChange={(e) => onChangeTier(e.target.value)}
              className="camera-select"
            >
              {Object.entries(MODELS).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
            <label className="help-text" htmlFor="threshold">
              Min confidence: {Math.round(threshold * 100)}%
            </label>
            <input
              id="threshold"
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => onChangeThreshold(Number(e.target.value))}
              className="threshold-slider"
            />
            <p className="help-text">Higher = fewer wrong boxes, but more missed objects</p>
          </>
        )}
      </div>

      {devices.length > 0 && (
        <div className="controls-section">
          <h3>Camera</h3>
          <select 
            value={selectedDeviceId || ''} 
            onChange={(e) => onChangeCamera(e.target.value)}
            className="camera-select"
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
          {devices.length > 1 && (
            <button onClick={onSwitchCamera} className="btn-secondary">
              Switch Camera
            </button>
          )}
        </div>
      )}

      <div className="controls-section">
        <h3>Video file</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            if (e.target.files[0]) onVideoFile(e.target.files[0]);
            e.target.value = ''; // allow picking the same file again
          }}
        />
        <button onClick={() => fileInputRef.current.click()} className="btn-secondary">
          🎞️ Upload video
        </button>
        {isFilePlaying && (
          <button onClick={onUseCamera} className="btn-secondary">
            📷 Back to camera
          </button>
        )}
        <p className="help-text">Runs locally; the video never leaves your device</p>
      </div>

      {/* Mobile-friendly camera toggle button */}
      {devices.length === 0 && (
        <div className="controls-section">
          <h3>Camera</h3>
          <button onClick={onSwitchCamera} className="btn-secondary">
            📷 Flip Camera
          </button>
          <p className="help-text">Toggle between front and back camera</p>
        </div>
      )}
    </div>
  );
}
