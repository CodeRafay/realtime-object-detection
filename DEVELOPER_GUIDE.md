# 🎯 Real-Time Object Detection - Quick Reference

## 📁 Project Structure

```
realTimeOD/
├── public/
│   └── models/
│       └── yolov8n.onnx          # Place ONNX model here
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
│   │   └── postprocessing.js    # NMS & output processing
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

- Model loading and initialization
- Inference loop management
- FPS calculation

### 4. `src/utils/modelLoader.js`

- ONNX Runtime initialization
- WebGPU setup
- Model loading and warmup

### 5. `src/utils/preprocessing.js`

- Image resizing and padding
- Tensor conversion
- CHW format transformation

### 6. `src/utils/postprocessing.js`

- Non-Maximum Suppression (NMS)
- Bounding box scaling
- Detection filtering

## 🔧 Configuration

### Model Settings (`src/utils/constants.js`)

```javascript
export const MODEL_CONFIG = {
  modelPath: "/models/yolov8n.onnx",
  inputWidth: 640,
  inputHeight: 640,
  confidenceThreshold: 0.25,
  iouThreshold: 0.45,
  maxDetections: 100,
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

1. **Custom Classes**: Edit `COCO_CLASSES` in `src/utils/constants.js`
2. **Colors**: Modify `COLORS` array in `src/utils/constants.js`
3. **Styles**: Edit component CSS files
4. **Detection Logic**: Modify `src/utils/postprocessing.js`

### Performance Tuning

1. **Lower Resolution**: Reduce `inputWidth/inputHeight` in MODEL_CONFIG
2. **Higher Threshold**: Increase `confidenceThreshold`
3. **Camera Resolution**: Adjust in `CAMERA_CONFIG`
4. **Use OffscreenCanvas**: Already implemented for compatible browsers

## 🔍 Code Flow

### Application Lifecycle

1. **Initialization**

   - Camera access requested (`useCamera` hook)
   - User grants camera permissions
   - Video stream starts

2. **Model Loading**

   - User clicks "Load Model"
   - ONNX Runtime initialized
   - Model downloaded and loaded
   - WebGPU or WebAssembly selected
   - Model warmed up with dummy input

3. **Detection Loop**

   - User clicks "Start Detection"
   - `requestAnimationFrame` loop begins
   - Each frame:
     - Video frame extracted
     - Preprocessed (resize, normalize, CHW format)
     - Inference runs (ONNX Runtime)
     - Postprocessing (NMS, scaling)
     - Bounding boxes drawn on canvas
     - FPS calculated and updated

4. **Cleanup**
   - User stops detection
   - Animation frame cancelled
   - Stream tracks stopped when unmounting

## 🧪 Testing Checklist

- [ ] Camera access works
- [ ] Model loads without errors
- [ ] Detection starts and runs smoothly
- [ ] Bounding boxes appear correctly
- [ ] FPS is displayed
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
# Verify file exists
ls -lh public/models/yolov8n.onnx

# Check path matches
grep modelPath src/utils/constants.js
```

### Low FPS

1. Check execution provider (should be WebGPU)
2. Reduce camera resolution
3. Close other GPU applications
4. Lower confidence threshold

## 📊 Performance Benchmarks

### Expected FPS

| Device Type      | WebGPU | WebAssembly |
| ---------------- | ------ | ----------- |
| Desktop/Laptop   | 30-60  | 10-20       |
| High-end Mobile  | 20-30  | 5-10        |
| Mid-range Mobile | 15-25  | 3-8         |

## 🛠️ Development Tips

### Enable Detailed Logging

Uncomment console.log statements in:

- `src/utils/modelLoader.js`
- `src/hooks/useObjectDetection.js`
- `src/hooks/useCamera.js`

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

- `react` (18.2.0) - UI framework
- `react-dom` (18.2.0) - React DOM rendering
- `onnxruntime-web` (1.17.0) - ML inference

### Development

- `vite` (5.0.8) - Build tool
- `@vitejs/plugin-react` (4.2.1) - React support
- `eslint` - Code linting

## 🚀 Deployment Checklist

- [ ] Model file in `public/models/`
- [ ] Build succeeds (`npm run build`)
- [ ] Test production build (`npm run preview`)
- [ ] HTTPS enabled (required for camera)
- [ ] CORS headers configured
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
- [YOLOv8 Documentation](https://docs.ultralytics.com/)

---

**Happy Coding! 🚀**
