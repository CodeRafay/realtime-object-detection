# 🎯 Real-Time Object Detection - Quick Reference

## 📁 Project Structure

```
realTimeOD/
├── public/
│   └── models/
│       ├── importModel.py        # Exports the three models below
│       ├── model-fast.onnx       # YOLO26n (80 COCO classes)
│       ├── model-accurate.onnx   # YOLO26s (80 COCO classes)
│       ├── model-more.onnx       # YOLOE-26s (268 classes)
│       └── labels.json           # Class names for model-more
├── src/
│   ├── components/               # React components
│   │   ├── App.jsx              # Main app
│   │   ├── CameraView.jsx       # Video display
│   │   ├── BoundingBoxCanvas.jsx # Detection overlay
│   │   ├── Controls.jsx         # UI controls
│   │   └── FPSMonitor.jsx       # Performance display
│   ├── hooks/                    # Custom React hooks
│   │   ├── useCamera.js         # Camera management
│   │   └── useObjectDetection.js # Detection pipeline
│   ├── utils/                    # Utility functions
│   │   ├── constants.js         # Configuration
│   │   ├── modelLoader.js       # ONNX model loading
│   │   ├── preprocessing.js     # Image preprocessing
│   │   ├── postprocessing.js    # NMS & output processing
│   │   ├── tracker.js           # Object tracking (stable IDs, smooth boxes)
│   │   └── tracker.test.js      # Unit tests (npm test)
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── DEPLOYMENT.md
└── MODEL_SETUP.md
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run unit tests
npm test
```

## 🎯 Key Files to Understand

### 1. `src/App.jsx`

- Main application component
- Orchestrates camera and detection
- Manages UI state

### 2. `src/hooks/useCamera.js`

- Camera access and management
- Device enumeration
- Stream handling

### 3. `src/hooks/useObjectDetection.js`

- Loads a quality tier (Fast / Accurate / More objects) and its labels; auto-picks Accurate on fast GPUs
- Inference loop (one run per new video frame via `requestVideoFrameCallback`)
- Feeds detections to the tracker; exposes `getTracks(now)` for drawing
- Detections/sec calculation

### 4. `src/utils/modelLoader.js`

- WebGPU first, WebAssembly fallback (1 WASM thread when WebGPU is used)
- **All ONNX Runtime calls go through one queue**: overlapping create/run/release can hang the page
- `loadModel`, `runInference`, `warmupModel`, `releaseModel`

### 5. `src/utils/preprocessing.js`

- Letterbox resize (keeps aspect ratio, gray padding)
- Reuses one canvas and one tensor buffer across frames
- CHW float32 conversion

### 6. `src/utils/postprocessing.js`

- Decodes any `[1, 4 + classes (+ extra rows), anchors]` YOLO output (shape read from the model)
- Per-class Non-Maximum Suppression (NMS)
- Scales boxes back to video pixels

### 7. `src/utils/tracker.js`

- ByteTrack-style IoU matching with velocity prediction: stable IDs
- Shows a box only after 2+ frames and while its score is ≥ the Min confidence slider
- `predict(now)` extrapolates boxes between detections so they're drawn at display rate

## 🔧 Configuration

### Model Settings (`src/utils/constants.js`)

```javascript
export const MODELS = {
  fast: { label: "Fast", path: "/models/model-fast.onnx", inputWidth: 640, inputHeight: 384 },
  accurate: { label: "Accurate", path: "/models/model-accurate.onnx", inputWidth: 640, inputHeight: 384 },
  more: { label: "More objects", path: "/models/model-more.onnx", labelsPath: "/models/labels.json", inputWidth: 640, inputHeight: 384 },
};

export const MODEL_CONFIG = {
  confidenceThreshold: 0.25, // default of the Min confidence slider
  lowConfidenceThreshold: 0.1, // keeps an already-shown object's ID alive
  iouThreshold: 0.45,
  maxDetections: 100,
  autoUpgradeMs: 40, // use Accurate if Fast runs faster than this
};
```

### Camera Settings (`src/utils/constants.js`)

```javascript
export const CAMERA_CONFIG = {
  defaultWidth: 640,
  defaultHeight: 480,
  idealWidth: 1280,
  idealHeight: 720,
  facingMode: "user",
};
```

## 🎨 Customization Points

### Add New Features

1. **Custom Classes**: Edit `NAMES` in `public/models/importModel.py` and re-run it (More objects tier)
2. **Colors**: Modify `COLORS` array in `src/utils/constants.js`
3. **Styles**: Edit component CSS files
4. **Detection Logic**: Modify `src/utils/postprocessing.js` / `src/utils/tracker.js` (run `npm test` after)

### Performance Tuning

1. **Quality tier**: Fast is ~3–4× quicker than Accurate
2. **Lower Resolution**: Change the size in `TIERS` (`importModel.py`), re-export, and match `inputWidth/inputHeight` in `MODELS`
3. **Camera Resolution**: Adjust in `CAMERA_CONFIG`

## 🔍 Code Flow

### Application Lifecycle

1. **Initialization**

   - Camera access requested (`useCamera` hook)
   - User grants camera permissions
   - Video stream starts

2. **Model Loading**

   - User clicks "Load Model"
   - Fast model + labels downloaded, WebGPU or WebAssembly selected
   - Model warmed up (compiles GPU shaders) and timed; if fast enough, Accurate is loaded instead
   - Changing Quality later stops detection and loads that tier; the old session is released via the queue

3. **Detection Loop** (inference, in `useObjectDetection`)

   - User clicks "Start Detection"
   - Runs once per new video frame (`requestVideoFrameCallback`, rAF fallback)
   - Each run:
     - Frame letterboxed into a 640×384 CHW tensor
     - Inference (ONNX Runtime, serialized)
     - Decode + NMS, scale to video pixels
     - `tracker.update(detections, now, minConfidence)`
     - Detections/sec and object count updated once per second

4. **Drawing Loop** (`BoundingBoxCanvas`, independent of inference)

   - `requestAnimationFrame` at display rate draws `getTracks(performance.now())`
   - Boxes are extrapolated between detections, so they glide with moving objects
   - The canvas uses `object-fit: contain` like the video, so boxes line up for any panel shape

5. **Cleanup**
   - User stops detection: loop id bumped, tracker dropped, drawing loop cancelled
   - Stream tracks stopped when unmounting

## 🧪 Testing Checklist

- [ ] Camera access works
- [ ] Model loads without errors
- [ ] Detection starts and runs smoothly
- [ ] Bounding boxes sit on the objects (never in black bars)
- [ ] Model FPS and display FPS are shown
- [ ] Switching Quality (Fast / Accurate / More objects) works while detecting
- [ ] Min confidence slider hides boxes below its value
- [ ] Video upload and "Back to camera" work
- [ ] `npm test` passes
- [ ] Camera switching works
- [ ] Responsive on mobile
- [ ] Works on different browsers

## 🐛 Common Issues

### Camera Not Working

```javascript
// Check in browser console
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => console.log("Camera OK"))
  .catch((err) => console.error("Camera error:", err));
```

### Model Not Loading

```bash
# Verify files exist
ls -lh public/models/model-*.onnx public/models/labels.json

# Check paths match
grep "path:" src/utils/constants.js
```

### Low Detections/sec

1. Check execution provider (should be WebGPU)
2. Switch Quality to **Fast**
3. Keep the tab in front: Chrome throttles covered/minimized windows to ~2 fps
4. Close other GPU applications

## 📊 Performance Benchmarks

Measured on an Intel UHD 620 laptop iGPU (Chrome, WebGPU, 640×384 input):

| Quality      | Model     | Inference | Detections/sec | mAP (COCO val) |
| ------------ | --------- | --------- | -------------- | -------------- |
| Fast         | YOLO26n   | ~90 ms    | 7–8            | 0.380          |
| Accurate     | YOLO26s   | ~200 ms   | ~2             | 0.475          |
| More objects | YOLOE-26s | ~245 ms   | ~2             | 0.370          |

Boxes are redrawn at display rate (~60 fps) between detections. WebAssembly (no WebGPU) is 3–4× slower.

## 🛠️ Development Tips

### Logging

The console shows which backend loaded and each tier's measured ms/frame
(`✓ Using Fast model (86 ms/frame on webgpu)`). There is deliberately no per-frame
logging: it was a major slowdown in the original version.

### Test WebGPU Support

```javascript
// In browser console
if (navigator.gpu) {
  console.log("WebGPU is supported");
} else {
  console.log("WebGPU not available");
}
```

### Monitor Performance

Use Chrome DevTools:

- Performance tab: Record inference loop
- Memory tab: Check for memory leaks
- Network tab: Verify model loads once

## 📦 Dependencies

### Production

- `react` (18.3) - UI framework
- `react-dom` (18.3) - React DOM rendering
- `onnxruntime-web` (1.23.2, pinned) - ML inference
- `@vercel/analytics` - Visitor analytics

### Development

- `vite` - Build tool
- `@vitejs/plugin-react` - React support
- `eslint` - Code linting
- Tests use Node's built-in `node --test` (no extra dependency)

### Model export (Python, optional)

- `ultralytics`, `onnxruntime` - used by `public/models/importModel.py`

## 🚀 Deployment Checklist

- [ ] `model-fast.onnx`, `model-accurate.onnx`, `model-more.onnx`, `labels.json` in `public/models/`
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Test production build (`npm run preview`)
- [ ] HTTPS enabled (required for camera)
- [ ] COOP/COEP headers configured (see `vercel.json`)
- [ ] Test on target browsers
- [ ] Mobile testing completed

## 📞 Support Resources

- **Documentation**: Check README.md, DEPLOYMENT.md, MODEL_SETUP.md
- **Browser Console**: First place to check for errors
- **Network Tab**: Verify model loads
- **GitHub Issues**: Report bugs or ask questions

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [YOLO26](https://docs.ultralytics.com/models/yolo26/) and [YOLOE](https://docs.ultralytics.com/models/yoloe/) Documentation

---

**Happy Coding! 🚀**
