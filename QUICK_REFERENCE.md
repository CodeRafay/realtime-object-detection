# 🚀 Quick Start Cheat Sheet

## ⚡ Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Run unit tests (tracker + output decoding)
npm test

# Re-export the three models (needs Python: pip install ultralytics onnxruntime)
cd public/models && python importModel.py
```

## 📁 Key File Locations

```
Configuration:     vite.config.js, package.json
Main App:          src/App.jsx
Camera Logic:      src/hooks/useCamera.js
Detection Logic:   src/hooks/useObjectDetection.js
Tracking:          src/utils/tracker.js
Model Settings:    src/utils/constants.js (MODELS, MODEL_CONFIG)
Model Files:       public/models/model-{fast,accurate,more}.onnx, labels.json
Model Export:      public/models/importModel.py
Documentation:     README.md, DEPLOYMENT.md
```

## 🎯 Common Tasks

### Change Detection Threshold

Use the **Min confidence** slider in the app. To change its default:

**File**: `src/utils/constants.js`

```javascript
confidenceThreshold: 0.25, // Lower = more detections, more wrong boxes
```

### Change Camera Resolution

**File**: `src/utils/constants.js`

```javascript
idealWidth: 1280; // Lower = better performance
idealHeight: 720;
```

### Change Model

Use the **Quality** menu in the app (Fast / Accurate / More objects). To swap a model file:

**File**: `src/utils/constants.js`

```javascript
fast: { label: "Fast", path: "/models/model-fast.onnx", inputWidth: 640, inputHeight: 384 },
```

### Add Custom Classes (More objects tier)

**File**: `public/models/importModel.py`: add names to `NAMES`, then re-run the export:

```bash
cd public/models && python importModel.py
```

## 🐛 Troubleshooting Quick Fixes

### Camera not working

```javascript
// Check in browser console:
navigator.mediaDevices.getUserMedia({ video: true });
```

### Model not loading

```bash
# Verify the model files exist:
dir public\models\model-*.onnx
```

### Check WebGPU support

```javascript
// In browser console:
console.log("WebGPU:", !!navigator.gpu);
```

### Clear cache and rebuild

```bash
rd /s /q dist node_modules
npm install
npm run build
```

## 🔧 Configuration Snippets

### Adjust Input Size (Performance)

The input size is baked into each model at export. Change it in `TIERS` in
`public/models/importModel.py`, re-export, then match it in `src/utils/constants.js`:

```javascript
inputWidth: 512,   // Smaller = faster, misses more small objects
inputHeight: 320,
```

### Increase Max Detections

```javascript
// src/utils/constants.js
maxDetections: 200,  // Default: 100
```

### Change NMS Threshold

```javascript
// src/utils/constants.js
iouThreshold: 0.3,  // Lower = more filtering
```

## 📊 Measured Performance

Intel UHD 620 laptop iGPU, Chrome, WebGPU, 640×384 input. Boxes are redrawn at display
rate (~60 fps) between detections, so motion looks smooth even at a few det/s.

| Quality      | Model     | Detections/sec | Accuracy (mAP, COCO val) |
| ------------ | --------- | -------------- | ------------------------ |
| Fast         | YOLO26n   | 7–8            | 0.380                    |
| Accurate     | YOLO26s   | ~2             | 0.475                    |
| More objects | YOLOE-26s | ~2             | 0.370 (268 classes)      |

## 🌐 Browser Requirements

✅ Chrome 113+, Edge 113+ (WebGPU)
⚠️ Firefox, Safari (WebAssembly fallback)

## 📦 Deployment Checklist

- [ ] `model-fast.onnx`, `model-accurate.onnx`, `model-more.onnx`, `labels.json` in `public/models/`
- [ ] `npm test` passes
- [ ] Run `npm run build`
- [ ] Test with `npm run preview`
- [ ] Upload `dist/` folder
- [ ] Ensure HTTPS enabled
- [ ] Test on mobile

## 🔗 Quick Links

- Main Docs: [README.md](README.md)
- Deploy Guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- Model Setup: [MODEL_SETUP.md](MODEL_SETUP.md)
- Dev Guide: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## 💡 Pro Tips

1. Use **Chrome DevTools** → Performance tab to profile
2. Keep the tab in front: Chrome throttles hidden/covered windows to ~2 fps
3. Test on actual devices, not just browser DevTools mobile mode
4. Model loads once and caches - refresh won't re-download
5. Check browser console for detailed error messages

## 🎨 Styling Quick Changes

```css
/* Main colors - src/index.css */
--primary-color: #4ecdc4;
--danger-color: #ff6b6b;
--success-color: #52be80;

/* Change theme in src/index.css :root {} */
```

## 🔐 Security Notes

- ✅ HTTPS required for camera in production
- ✅ No data sent to servers
- ✅ All processing local
- ✅ Model cached in browser

## 📞 Get Help

1. Check error in browser console
2. Review [README.md](README.md) troubleshooting
3. Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
4. Open GitHub issue

---

**Save this file for quick reference!** 📌
