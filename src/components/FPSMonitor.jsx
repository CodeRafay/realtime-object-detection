/**
 * FPS Monitor Component
 * Model FPS: frames the model processes per second (what the original app called FPS).
 * Display FPS: how often boxes are redrawn on screen (they're extrapolated between model frames).
 */

import { useEffect, useState } from 'react';
import './FPSMonitor.css';

export default function FPSMonitor({ fps, executionProvider }) {
  const [displayFps, setDisplayFps] = useState(0);

  // Same requestAnimationFrame rate the box canvas redraws at
  useEffect(() => {
    let raf;
    let frames = 0;
    let last = performance.now();
    const tick = (now) => {
      frames++;
      if (now - last >= 1000) {
        setDisplayFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fps-monitor">
      <div className="fps-value">{fps} FPS</div>
      <div className="fps-label">model frames per second</div>
      <div className="display-fps">Boxes redrawn at {displayFps} FPS</div>
      <div className="execution-provider">
        {executionProvider === 'webgpu' ? '⚡ WebGPU' : '🔧 WebAssembly'}
      </div>
    </div>
  );
}
