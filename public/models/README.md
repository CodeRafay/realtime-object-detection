# Model Files Directory

This directory should contain your ONNX model files.

## Required File

Place your YOLOv8n ONNX model here:

- `yolov8n.onnx` (approximately 6MB)

## How to Get the Model

See the [MODEL_SETUP.md](../../MODEL_SETUP.md) guide in the root directory for detailed instructions.

### Quick Setup:

1. Install Ultralytics:

   ```bash
   pip install ultralytics
   ```

2. Export YOLOv8n to ONNX:

   ```python
   from ultralytics import YOLO
   model = YOLO('yolov8n.pt')
   model.export(format='onnx', opset=12, simplify=True, dynamic=False, imgsz=640)
   ```

3. Move the file here:
   ```bash
   mv yolov8n.onnx public/models/
   ```

## Note

The model file is excluded from version control (see `.gitignore`) due to its size. Each developer/deployment must obtain the model separately.
