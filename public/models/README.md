# Model Files Directory

The app loads its models from here (served at `/models/`). All files are committed, so a fresh
clone works without any setup.

| File                  | Quality tier | Model     | Classes | Size  |
| --------------------- | ------------ | --------- | ------- | ----- |
| `model-fast.onnx`     | Fast         | YOLO26n   | 80 COCO | 5 MB  |
| `model-accurate.onnx` | Accurate     | YOLO26s   | 80 COCO | 19 MB |
| `model-more.onnx`     | More objects | YOLOE-26s | 268     | 21 MB |
| `labels.json`         | (class names for `model-more.onnx`, in model order) | | | |

All models are fp16 with a 640×384 input.

## Re-exporting

`importModel.py` regenerates every file above:

```bash
pip install ultralytics onnxruntime
cd public/models && python importModel.py
```

To make the **More objects** tier detect different things, edit `NAMES` in `importModel.py`
before running it. See [MODEL_SETUP.md](../../MODEL_SETUP.md) for details.

`*.pt` (PyTorch) weights in this folder are git-ignored.
