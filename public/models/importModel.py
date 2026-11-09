# Export the app's three model tiers to fp16 ONNX.
# Run from this folder:  pip install ultralytics onnxruntime  &&  python importModel.py
# Output: model-fast.onnx, model-accurate.onnx, model-more.onnx + labels.json (for the "more" tier).
# The "more" tier is open-vocabulary YOLOE: to detect something new, add its name to NAMES and
# re-run. Keep the list focused (a few hundred): open-vocab accuracy drops as the vocabulary grows.
#
# Measured on 500 COCO val2017 images (unseen by all models) + WebGPU on an Intel UHD 620, 384x640 fp16:
#   fast      YOLO26n    mAP50-95 0.380  ~120 ms   5 MB  (old app's yolov8n@640: 0.393, ~220 ms)
#   accurate  YOLO26s    mAP50-95 0.475  ~270 ms  19 MB
#   more      YOLOE-26s  mAP50-95 0.370  ~330 ms  21 MB  (268 classes incl. smartwatch, glasses)
# 384x640 fits 16:9 video with little padding (same detail as 640x640 on a 16:9 webcam, less compute).
# fp16 had identical accuracy to fp32 and was ~1.3-1.7x faster.

import json
from pathlib import Path

import onnx
from onnxruntime.transformers.float16 import convert_float_to_float16
from ultralytics import YOLO, YOLOE

# name -> (weights, H, W, open_vocab); H/W must match MODELS in src/utils/constants.js
TIERS = {
    'fast': ('yolo26n.pt', 384, 640, False),
    'accurate': ('yolo26s.pt', 384, 640, False),
    'more': ('yoloe-26s-seg.pt', 384, 640, True),
}

COCO = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
    'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush',
]

EXTRA = [
    # personal items / wearables
    'smartwatch', 'wristwatch', 'glasses', 'sunglasses', 'headphones', 'earbuds', 'hat', 'cap',
    'helmet', 'shoe', 'sneaker', 'boot', 'sock', 'glove', 'scarf', 'belt', 'jacket', 'shirt',
    'jeans', 'dress', 'ring', 'necklace', 'bracelet', 'earring', 'wallet', 'keys', 'id card',
    'face mask', 'watch strap',
    # electronics
    'tablet', 'monitor', 'speaker', 'microphone', 'camera', 'charger', 'power bank', 'cable',
    'usb drive', 'game controller', 'smart speaker', 'printer', 'router', 'calculator',
    'light bulb', 'lamp', 'fan', 'air conditioner', 'electric socket', 'light switch',
    'television remote', 'drone',
    # desk / office
    'pen', 'pencil', 'marker', 'notebook', 'paper', 'envelope', 'stapler', 'tape', 'ruler',
    'sticky note', 'folder', 'whiteboard', 'desk', 'office chair', 'trash can', 'box',
    'shopping bag', 'plastic bag',
    # home / kitchen
    'mug', 'plate', 'glass', 'jar', 'pot', 'pan', 'kettle', 'blender', 'cutting board',
    'water bottle', 'can', 'coffee machine', 'dishwasher', 'washing machine', 'towel',
    'pillow', 'blanket', 'curtain', 'mirror', 'door', 'window', 'shelf', 'cabinet', 'drawer',
    'rug', 'painting', 'picture frame', 'candle', 'plant', 'flower', 'basket', 'bucket',
    'broom', 'soap', 'toothpaste', 'comb', 'hairbrush', 'razor', 'perfume', 'lipstick',
    'medicine bottle', 'pill', 'tissue box', 'toilet paper', 'stairs',
    # tools
    'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'ladder', 'flashlight',
    # food
    'bread', 'egg', 'cheese', 'tomato', 'potato', 'onion', 'lemon', 'grapes', 'strawberry',
    'watermelon', 'cookie', 'chocolate', 'ice cream', 'french fries', 'burger', 'noodles',
    'rice', 'meat', 'fish', 'juice', 'coffee', 'tea',
    # outdoor / street
    'van', 'scooter', 'tractor', 'ambulance', 'police car', 'taxi', 'pickup truck',
    'traffic cone', 'street light', 'road sign', 'license plate', 'wheel', 'tree', 'building',
    'fence', 'pole', 'billboard', 'crosswalk', 'wheelchair', 'stroller', 'shopping cart',
    # sports / misc
    'football', 'basketball', 'tennis ball', 'cricket bat', 'dumbbell', 'yoga mat', 'guitar',
    'piano', 'violin', 'drum', 'toy', 'balloon', 'flag', 'umbrella stand', 'chess board',
    # animals
    'rabbit', 'mouse animal', 'chicken', 'duck', 'fish animal', 'monkey', 'goat', 'pigeon',
]

NAMES = list(dict.fromkeys(COCO + EXTRA))  # dedupe, keep order
out = Path(__file__).resolve().parent

for tier, (weights, h, w, open_vocab) in TIERS.items():
    if open_vocab:
        model = YOLOE(weights)
        model.set_classes(NAMES, model.get_text_pe(NAMES))
        fp32 = Path(model.export(format='onnx', imgsz=[h, w], simplify=True, dynamic=False))
    else:
        # end2end=False keeps the classic [1, 4+80, anchors] output the app decodes (YOLO26 defaults to NMS-free [1, 300, 6])
        fp32 = Path(YOLO(weights).export(format='onnx', imgsz=[h, w], simplify=True, dynamic=False, end2end=False))

    m = onnx.load(fp32)
    del m.graph.value_info[:]  # stale fp32 type info breaks the converted graph
    # keep_io_types: inputs/outputs stay float32 so the JS side is unchanged; Resize must stay fp32
    m = convert_float_to_float16(m, keep_io_types=True, op_block_list=['Resize'])
    onnx.save(m, out / f'model-{tier}.onnx')
    fp32.unlink()
    print(f'Wrote model-{tier}.onnx')

(out / 'labels.json').write_text(json.dumps(NAMES))
print(f'Wrote labels.json ({len(NAMES)} classes)')
