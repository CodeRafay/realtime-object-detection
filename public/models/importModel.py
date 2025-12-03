# Install Ultralytics
# pip install ultralytics

from ultralytics import YOLO
# Export model
model = YOLO('yolov8n.pt')
model.export(format='onnx', opset=12, simplify=True, dynamic=False, imgsz=640)

# Move to project
# Place yolov8n.onnx in: public/models/
