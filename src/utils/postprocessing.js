/**
 * Postprocessing for YOLO-family outputs: decode, NMS, rescale.
 */

/**
 * Intersection over Union for {x, y, width, height} boxes.
 */
export function calculateIoU(box1, box2) {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const unionArea = box1.width * box1.height + box2.width * box2.height - intersectionArea;

  return unionArea > 0 ? intersectionArea / unionArea : 0;
}

/**
 * Per-class Non-Maximum Suppression.
 */
export function nonMaxSuppression(detections, iouThreshold = 0.45) {
  detections.sort((a, b) => b.confidence - a.confidence);

  const selected = [];
  const suppressed = new Uint8Array(detections.length);

  for (let i = 0; i < detections.length; i++) {
    if (suppressed[i]) continue;
    selected.push(detections[i]);

    for (let j = i + 1; j < detections.length; j++) {
      if (!suppressed[j] && detections[i].classId === detections[j].classId &&
          calculateIoU(detections[i], detections[j]) > iouThreshold) {
        suppressed[j] = 1;
      }
    }
  }

  return selected;
}

/**
 * Decode a YOLO output of shape [1, 4 + numClasses (+ extra rows), numAnchors].
 * Extra rows (e.g. YOLOE-seg's 32 mask coefficients) are ignored.
 *
 * @param {{data: Float32Array, dims: number[]}} output - Model output
 * @param {number} confidenceThreshold - Minimum score to keep
 * @param {number} iouThreshold - IoU threshold for NMS
 * @param {Array<string>} classNames - Labels; length defines numClasses
 * @param {number} maxDetections - Cap on returned detections
 */
export function processOutput(
  { data, dims },
  confidenceThreshold = 0.25,
  iouThreshold = 0.45,
  classNames = [],
  maxDetections = 100
) {
  const numAnchors = dims[2];
  const numClasses = Math.min(classNames.length, dims[1] - 4);
  const detections = [];

  for (let i = 0; i < numAnchors; i++) {
    let maxScore = 0;
    let maxClassId = 0;
    for (let c = 0; c < numClasses; c++) {
      const score = data[(4 + c) * numAnchors + i];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }

    if (maxScore > confidenceThreshold) {
      const w = data[2 * numAnchors + i];
      const h = data[3 * numAnchors + i];
      detections.push({
        x: data[i] - w / 2,
        y: data[numAnchors + i] - h / 2,
        width: w,
        height: h,
        confidence: maxScore,
        classId: maxClassId,
        className: classNames[maxClassId],
      });
    }
  }

  return nonMaxSuppression(detections, iouThreshold).slice(0, maxDetections);
}

/**
 * Map detections from letterboxed model space back to source pixels.
 */
export function scaleDetections(detections, scale, offsetX, offsetY, originalWidth, originalHeight) {
  return detections.map(det => ({
    ...det,
    x: (det.x - offsetX) / scale,
    y: (det.y - offsetY) / scale,
    width: det.width / scale,
    height: det.height / scale,
  })).filter(det =>
    det.x < originalWidth &&
    det.y < originalHeight &&
    det.x + det.width > 0 &&
    det.y + det.height > 0
  );
}
