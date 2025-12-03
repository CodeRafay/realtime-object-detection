/**
 * Bounding Box Canvas Component
 * Overlays detection boxes on video feed
 */

import { useEffect, useRef } from 'react';
import { COLORS } from '../utils/constants';
import './BoundingBoxCanvas.css';

export default function BoundingBoxCanvas({ 
  videoRef, 
  detections, 
  isDetecting 
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    // Match canvas size to video size
    const resizeCanvas = () => {
      canvas.width = video.videoWidth || video.width;
      canvas.height = video.videoHeight || video.height;
    };

    resizeCanvas();
    video.addEventListener('loadedmetadata', resizeCanvas);

    return () => {
      video.removeEventListener('loadedmetadata', resizeCanvas);
    };
  }, [videoRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    console.log('Canvas drawing - isDetecting:', isDetecting, 'detections:', detections.length);

    if (!isDetecting || detections.length === 0) return;

    console.log('Drawing detections:', detections);

    // Draw each detection
    detections.forEach((detection) => {
      const { x, y, width, height, confidence, className, classId } = detection;

      console.log(`Drawing box: ${className} at (${x}, ${y}) size: ${width}x${height}`);

      // Get color for this class
      const color = COLORS[classId % COLORS.length];

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${className} ${(confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 16px Arial';
      const textMetrics = ctx.measureText(label);
      const textHeight = 20;
      const padding = 4;

      ctx.fillStyle = color;
      ctx.fillRect(
        x,
        y - textHeight - padding,
        textMetrics.width + padding * 2,
        textHeight + padding
      );

      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, x + padding, y - padding);
    });
  }, [detections, isDetecting]);

  return <canvas ref={canvasRef} className="bounding-box-canvas" />;
}
