/**
 * Postprocessing utilities for YOLOv8 output
 * Includes Non-Maximum Suppression (NMS) and bounding box conversion
 */

/**
 * Intersection over Union (IoU) calculation
 * @param {Object} box1 - First bounding box {x, y, width, height}
 * @param {Object} box2 - Second bounding box {x, y, width, height}
 * @returns {number} - IoU score
 */
function calculateIoU(box1, box2) {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - intersectionArea;

  return intersectionArea / unionArea;
}

/**
 * Non-Maximum Suppression (NMS)
 * Removes overlapping bounding boxes
 * @param {Array} detections - Array of detection objects
 * @param {number} iouThreshold - IoU threshold for suppression
 * @returns {Array} - Filtered detections
 */
export function nonMaxSuppression(detections, iouThreshold = 0.45) {
  if (detections.length === 0) return [];

  // Sort by confidence (descending)
  detections.sort((a, b) => b.confidence - a.confidence);

  const selected = [];
  const suppressed = new Set();

  for (let i = 0; i < detections.length; i++) {
    if (suppressed.has(i)) continue;

    selected.push(detections[i]);

    for (let j = i + 1; j < detections.length; j++) {
      if (suppressed.has(j)) continue;

      // Only compare boxes of the same class
      if (detections[i].classId === detections[j].classId) {
        const iou = calculateIoU(detections[i], detections[j]);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }
  }

  return selected;
}

/**
 * Process YOLOv8 output tensor into detections
 * YOLOv8 output format: [1, 84, 8400] for n model
 * 84 = 4 bbox coords + 80 class scores
 * 
 * @param {Float32Array} output - Model output tensor
 * @param {number} modelWidth - Model input width
 * @param {number} modelHeight - Model input height
 * @param {number} confidenceThreshold - Minimum confidence threshold
 * @param {number} iouThreshold - IoU threshold for NMS
 * @param {Array} classNames - Array of class names
 * @returns {Array} - Array of detection objects
 */
export function processOutput(
  output,
  modelWidth,
  modelHeight,
  confidenceThreshold = 0.25,
  iouThreshold = 0.45,
  classNames = []
) {
  const detections = [];
  const numDetections = 8400; // YOLOv8n has 8400 predictions
  const numClasses = 80;

  console.log('Processing output, length:', output.length, 'Expected:', 84 * 8400);

  // YOLOv8 format: output is transposed [1, 84, 8400]
  // We need to iterate through each of the 8400 predictions
  for (let i = 0; i < numDetections; i++) {
    // Get bounding box coordinates (first 4 values)
    const x = output[i];
    const y = output[numDetections + i];
    const w = output[2 * numDetections + i];
    const h = output[3 * numDetections + i];

    // Find the class with maximum score (next 80 values)
    let maxScore = 0;
    let maxClassId = 0;

    for (let c = 0; c < numClasses; c++) {
      const score = output[(4 + c) * numDetections + i];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }

    // Filter by confidence threshold
    if (maxScore > confidenceThreshold) {
      // Convert from center format to corner format
      const x1 = x - w / 2;
      const y1 = y - h / 2;

      detections.push({
        x: x1,
        y: y1,
        width: w,
        height: h,
        confidence: maxScore,
        classId: maxClassId,
        className: classNames[maxClassId] || `Class ${maxClassId}`,
      });
    }
  }

  console.log(`Found ${detections.length} detections before NMS (threshold: ${confidenceThreshold})`);

  // Apply Non-Maximum Suppression
  const nmsDetections = nonMaxSuppression(detections, iouThreshold);
  console.log(`After NMS: ${nmsDetections.length} detections`);
  
  return nmsDetections;
}

/**
 * Scale detections back to original image coordinates
 * @param {Array} detections - Array of detections
 * @param {number} scale - Scale factor from preprocessing
 * @param {number} offsetX - X offset from preprocessing
 * @param {number} offsetY - Y offset from preprocessing
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @returns {Array} - Scaled detections
 */
export function scaleDetections(detections, scale, offsetX, offsetY, originalWidth, originalHeight) {
  return detections.map(det => ({
    ...det,
    x: (det.x - offsetX) / scale,
    y: (det.y - offsetY) / scale,
    width: det.width / scale,
    height: det.height / scale,
  })).filter(det => {
    // Filter out boxes that are outside the original image
    return det.x < originalWidth && 
           det.y < originalHeight && 
           det.x + det.width > 0 && 
           det.y + det.height > 0;
  });
}
