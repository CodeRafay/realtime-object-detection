/**
 * Camera View Component
 * Displays video feed with overlaid detection boxes
 */

import { useEffect } from 'react';
import BoundingBoxCanvas from './BoundingBoxCanvas';
import './CameraView.css';

export default function CameraView({ 
  videoRef, 
  stream,
  isFilePlaying,
  getTracks,
  isDetecting 
}) {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream]);

  return (
    <div className="camera-view">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-element"
        />
        <BoundingBoxCanvas 
          videoRef={videoRef} 
          getTracks={getTracks}
          isDetecting={isDetecting} 
        />
      </div>
      {!stream && !isFilePlaying && (
        <div className="no-stream-message">
          <p>📷 Camera not active</p>
          <p className="hint">Click &ldquo;Start Camera&rdquo; to begin</p>
        </div>
      )}
    </div>
  );
}
