/**
 * Controls Component
 * Start/Stop detection, camera switching, and settings
 */

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
}) {
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
        {isModelLoaded && !isDetecting && (
          <button onClick={onStartDetection} className="btn-success">
            Start Detection
          </button>
        )}
        {isModelLoaded && isDetecting && (
          <button onClick={onStopDetection} className="btn-danger">
            Stop Detection
          </button>
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
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${devices.indexOf(device) + 1}`}
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
    </div>
  );
}
