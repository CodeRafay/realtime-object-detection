# Model Setup Guide

The app ships with three ready-to-use models in `public/models/`, so **no setup is needed**
to run it. This guide covers re-exporting them, changing what they detect, and using your own.

## 📦 The Three Tiers

| Quality tier     | File                  | Model     | Classes | mAP50-95* | Inference** | Size  |
| ---------------- | --------------------- | --------- | ------- | --------- | ----------- | ----- |
| Fast (default)   | `model-fast.onnx`     | YOLO26n   | 80 COCO | 0.380     | ~90 ms      | 5 MB  |
| Accurate         | `model-accurate.onnx` | YOLO26s   | 80 COCO | 0.475     | ~200 ms     | 19 MB |
| More objects     | `model-more.onnx`     | YOLOE-26s | 268     | 0.370     | ~245 ms     | 21 MB |

\* 500 COCO val2017 images none of the models were trained on. The original app's yolov8n scored 0.393.
\*\* WebGPU on an Intel UHD 620 laptop iGPU.

All three are exported as fp16 (same accuracy as fp32, 1.3–1.7× faster) with a 640×384
input, which fits 16:9 video with little padding.

The **More objects** tier uses YOLOE, an open-vocabulary model: you give it a list of names
(e.g. "smartwatch", "earbuds") and it detects them. It's less accurate than YOLO26 on common
objects, which is why it's a separate tier.

## 🔁 Re-exporting the Models

```bash
pip install ultralytics onnxruntime
cd public/models
python importModel.py
```

This downloads the PyTorch weights, exports each tier to ONNX, converts it to fp16, and writes
`model-fast.onnx`, `model-accurate.onnx`, `model-more.onnx` and `labels.json`.

## 🏷️ Changing What "More objects" Detects

1. Edit `NAMES` in `public/models/importModel.py` (the first 80 are the COCO classes; add or
   remove from `EXTRA`).
2. Re-run `python importModel.py`.

Keep the list focused (a few hundred at most): open-vocabulary accuracy drops as the list grows,
and similar names (e.g. "car" / "taxi" / "van") compete for the same object.

## 📐 Changing the Input Size

The input size is fixed in each exported model.

1. Change `H, W` for the tier in `TIERS` in `importModel.py` and re-export.
2. Set the same `inputWidth` / `inputHeight` for that tier in `MODELS` in `src/utils/constants.js`.

Smaller is faster but misses more small objects.

## 🎨 Using Your Own Model

Any Ultralytics YOLO detection (or segmentation) model works, including custom-trained ones:

```python
from ultralytics import YOLO

model = YOLO("my-model.pt")  # e.g. trained with model.train(data="my-data.yaml")
# end2end=False keeps the [1, 4 + classes, anchors] output the app decodes (needed for YOLO26)
model.export(format="onnx", imgsz=[384, 640], simplify=True, dynamic=False, end2end=False)
```

Then:

1. Put the `.onnx` file in `public/models/`.
2. If it isn't an 80-class COCO model, add a JSON array of class names (in model order).
3. Point a tier in `MODELS` (`src/utils/constants.js`) at it: `path`, `inputWidth`, `inputHeight`
   and, for non-COCO classes, `labelsPath`.

The output shape is read from the model, so no decoding changes are needed.

## 🧪 Expected Output Format

```
Input:  images  float32 [1, 3, H, W]        (RGB, 0–1, letterboxed with gray 114)
Output: output0 float32 [1, 4 + C (+ 32), N]
        rows 0–3: box center x, center y, width, height (input pixels)
        rows 4…4+C-1: per-class scores (0–1)
        +32 mask rows on segmentation models (YOLOE): ignored
```

For 640×384 input, N = 5040.

## ⚠️ Troubleshooting

### Output shape is `[1, 300, 6]`

YOLO26 exports an NMS-free head by default. Re-export with `end2end=False`.

### fp16 model fails to load ("Type Error … Resize")

The fp16 conversion must keep `Resize` in fp32 and clear stale type info. `importModel.py` does
both; reuse its conversion code if converting by hand.

### Model not loading

- Check the file exists: `ls public/models/model-*.onnx`
- Check the path in `MODELS` matches
- Check the browser console for the ONNX Runtime error

### Boxes in the wrong place

`inputWidth` / `inputHeight` in `MODELS` must match the size the model was exported with.

## 📝 Notes

- YOLO26 and YOLOE weights are by Ultralytics and licensed AGPL-3.0.
- `*.pt` weights in `public/models/` are git-ignored; the `.onnx` files are committed.
