/**
 * FPS Monitor Component
 * Displays current frames per second
 */

import './FPSMonitor.css';

export default function FPSMonitor({ fps, executionProvider }) {
  return (
    <div className="fps-monitor">
      {/* model runs per second; boxes are redrawn at display rate in between */}
      <div className="fps-value">{fps} det/s</div>
      <div className="execution-provider">
        {executionProvider === 'webgpu' ? '⚡ WebGPU' : '🔧 WebAssembly'}
      </div>
    </div>
  );
}
