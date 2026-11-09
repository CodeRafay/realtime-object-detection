/**
 * Preprocessing for YOLO model input (letterbox + CHW float)
 */

// Reused across frames: allocating a canvas + 2.7MB array per frame was a big chunk of the frame time.
let canvas = null;
let ctx = null;
let tensor = null;

/**
 * Letterbox the source into a modelWidth x modelHeight CHW Float32Array in [0, 1].
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} source
 * @returns {{tensor: Float32Array, scale: number, offsetX: number, offsetY: number}}
 */
export function preprocessImage(source, modelWidth, modelHeight) {
  if (!canvas || canvas.width !== modelWidth || canvas.height !== modelHeight) {
    canvas = document.createElement('canvas');
    canvas.width = modelWidth;
    canvas.height = modelHeight;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    tensor = new Float32Array(3 * modelWidth * modelHeight);
  }

  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;
  const scale = Math.min(modelWidth / sourceWidth, modelHeight / sourceHeight);
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const offsetX = (modelWidth - scaledWidth) / 2;
  const offsetY = (modelHeight - scaledHeight) / 2;

  ctx.fillStyle = '#727272'; // YOLO's letterbox gray (114)
  ctx.fillRect(0, 0, modelWidth, modelHeight);
  ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight);

  const pixels = ctx.getImageData(0, 0, modelWidth, modelHeight).data;
  const area = modelWidth * modelHeight;
  const inv = 1 / 255;
  for (let p = 0, i = 0; p < area; p++, i += 4) {
    tensor[p] = pixels[i] * inv;
    tensor[area + p] = pixels[i + 1] * inv;
    tensor[2 * area + p] = pixels[i + 2] * inv;
  }

  return { tensor, scale, offsetX, offsetY };
}
