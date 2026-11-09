/**
 * Bounding Box Canvas Component
 * Overlays detection boxes on video feed
 */

import { useEffect, useRef } from 'react';
import { COLORS } from '../utils/constants';
import './BoundingBoxCanvas.css';

export default function BoundingBoxCanvas({ 
  videoRef, 
  getTracks,
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
    if (!isDetecting) return;

    // Redraw every display frame with boxes extrapolated to now, so they glide between detections
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      getTracks(performance.now()).forEach((detection) => drawBox(ctx, detection));
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [getTracks, isDetecting]);

  return <canvas ref={canvasRef} className="bounding-box-canvas" />;
}

function drawBox(ctx, { id, x, y, width, height, confidence, className }) {
  // Color per track (first 20 palette entries are the bright ones), so each object keeps its color
  const color = COLORS[id % 20];

  // Draw bounding box
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  // Draw label background
  const label = `${className} #${id} ${(confidence * 100).toFixed(0)}%`;
  ctx.font = 'bold 16px Arial';
  const textHeight = 20;
  const padding = 4;
  ctx.fillStyle = color;
  ctx.fillRect(x, y - textHeight - padding, ctx.measureText(label).width + padding * 2, textHeight + padding);

  // Draw label text
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(label, x + padding, y - padding);
}
