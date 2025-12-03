/**
 * COCO Dataset Class Labels (80 classes)
 * These are the object classes that YOLOv8 can detect
 */
export const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

/**
 * Color palette for bounding boxes
 * Each class gets a consistent color
 */
export const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  '#EC7063', '#AF7AC5', '#5DADE2', '#48C9B0', '#F5B041',
  '#EB984E', '#DC7633', '#CA6F1E', '#BA4A00', '#A04000',
  '#7D3C98', '#2471A3', '#17A589', '#229954', '#D4AC0D',
  '#CA6F1E', '#BA4A00', '#17202A', '#1B4F72', '#145A32',
  '#7D6608', '#784212', '#6E2C00', '#4A235A', '#154360',
  '#0E6251', '#145A32', '#7D6608', '#784212', '#641E16',
  '#4D5656', '#1C2833', '#1B2631', '#17202A', '#0B5345',
  '#186A3B', '#7D6608', '#784212', '#6E2C00', '#512E5F',
  '#154360', '#0E6251', '#145A32', '#7D6608', '#784212',
  '#641E16', '#4D5656', '#1C2833', '#1B2631', '#17202A',
  '#0B5345', '#186A3B', '#7D6608', '#784212', '#6E2C00',
  '#512E5F', '#154360', '#0E6251', '#145A32', '#7D6608',
  '#784212', '#641E16', '#4D5656', '#1C2833', '#1B2631',
  '#17202A', '#0B5345', '#186A3B', '#7D6608', '#784212'
];

/**
 * Model configuration
 */
export const MODEL_CONFIG = {
  // For production: Use GitHub Release URL
  // For local development: Use '/models/yolov8n.onnx'
  modelPath: import.meta.env.PROD 
    ? 'https://github.com/CodeRafay/realtime-object-detection/releases/download/v1.0.0/yolov8n.onnx'
    : '/models/yolov8n.onnx',
  inputWidth: 640,
  inputHeight: 640,
  confidenceThreshold: 0.2, 
  iouThreshold: 0.45,
  maxDetections: 100,
};

/**
 * Default camera settings
 */
export const CAMERA_CONFIG = {
  defaultWidth: 640,
  defaultHeight: 480,
  idealWidth: 1280,
  idealHeight: 720,
  facingMode: 'user', // 'user' for front camera, 'environment' for back camera
};
