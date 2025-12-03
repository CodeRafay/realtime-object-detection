/**
 * FPS Monitor Component
 * Displays current frames per second
 */

import './FPSMonitor.css';

export default function FPSMonitor({ fps, executionProvider }) {
  return (
    <div className="fps-monitor">
      <div className="fps-value">{fps} FPS</div>
      <div className="execution-provider">
        {executionProvider === 'webgpu' ? '⚡ WebGPU' : '🔧 WebAssembly'}
      </div>
    </div>
  );
}
