/**
 * Preprocessing utilities for YOLOv8 model input
 */

/**
 * Preprocesses an image for YOLOv8 inference
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} source - Image source
 * @param {number} modelWidth - Target width (default 640)
 * @param {number} modelHeight - Target height (default 640)
 * @returns {Object} - { tensor: Float32Array, canvas: HTMLCanvasElement, scale: number }
 */
export function preprocessImage(source, modelWidth = 640, modelHeight = 640) {
  // Create offscreen canvas for better performance
  const canvas = document.createElement('canvas');
  canvas.width = modelWidth;
  canvas.height = modelHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Calculate scaling to maintain aspect ratio
  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;
  const scale = Math.min(modelWidth / sourceWidth, modelHeight / sourceHeight);
  
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const offsetX = (modelWidth - scaledWidth) / 2;
  const offsetY = (modelHeight - scaledHeight) / 2;

  // Fill with gray background (padding)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, modelWidth, modelHeight);

  // Draw scaled image centered
  ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight);

  // Get image data
  const imageData = ctx.getImageData(0, 0, modelWidth, modelHeight);
  const pixels = imageData.data;

  // Convert to Float32Array in CHW format (channels, height, width)
  // Normalize to [0, 1] range by dividing by 255
  const tensor = new Float32Array(3 * modelWidth * modelHeight);
  
  for (let i = 0; i < pixels.length; i += 4) {
    const pixelIndex = i / 4;
    const row = Math.floor(pixelIndex / modelWidth);
    const col = pixelIndex % modelWidth;
    
    // RGB channels in CHW format
    tensor[row * modelWidth + col] = pixels[i] / 255.0; // R
    tensor[modelWidth * modelHeight + row * modelWidth + col] = pixels[i + 1] / 255.0; // G
    tensor[2 * modelWidth * modelHeight + row * modelWidth + col] = pixels[i + 2] / 255.0; // B
  }

  return { 
    tensor, 
    canvas,
    scale,
    offsetX,
    offsetY 
  };
}

/**
 * Alternative preprocessing using OffscreenCanvas (when available)
 * Better performance in modern browsers
 */
export async function preprocessImageOffscreen(source, modelWidth = 640, modelHeight = 640) {
  if (typeof OffscreenCanvas === 'undefined') {
    return preprocessImage(source, modelWidth, modelHeight);
  }

  const canvas = new OffscreenCanvas(modelWidth, modelHeight);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;
  const scale = Math.min(modelWidth / sourceWidth, modelHeight / sourceHeight);
  
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const offsetX = (modelWidth - scaledWidth) / 2;
  const offsetY = (modelHeight - scaledHeight) / 2;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, modelWidth, modelHeight);
  ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight);

  const imageData = ctx.getImageData(0, 0, modelWidth, modelHeight);
  const pixels = imageData.data;

  const tensor = new Float32Array(3 * modelWidth * modelHeight);
  
  for (let i = 0; i < pixels.length; i += 4) {
    const pixelIndex = i / 4;
    const row = Math.floor(pixelIndex / modelWidth);
    const col = pixelIndex % modelWidth;
    
    tensor[row * modelWidth + col] = pixels[i] / 255.0;
    tensor[modelWidth * modelHeight + row * modelWidth + col] = pixels[i + 1] / 255.0;
    tensor[2 * modelWidth * modelHeight + row * modelWidth + col] = pixels[i + 2] / 255.0;
  }

  return { 
    tensor, 
    canvas: null, // OffscreenCanvas doesn't need to be returned
    scale,
    offsetX,
    offsetY 
  };
}
