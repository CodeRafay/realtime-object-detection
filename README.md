# 🎯 Real-Time Object Detection Web App

A high-performance, privacy-first web application for real-time object detection that runs **entirely in your browser** using WebGPU acceleration and ONNXRuntime-Web. No server required, no data leaves your device.

![React](https://img.shields.io/badge/React-18.2-blue)
![ONNX Runtime](https://img.shields.io/badge/ONNX%20Runtime-1.17-green)

## ✨ Features

- 🚀 **High-Speed Inference**: 30-60 FPS on laptops, 15-30 FPS on modern mobile devices
- 🔒 **Complete Privacy**: All processing happens locally, zero data transmission
- ⚡ **WebGPU Accelerated**: Leverages GPU for maximum performance
- 📱 **Mobile Compatible**: Works on both desktop and mobile browsers
- 🎥 **Multi-Camera Support**: Switch between front/back cameras
- 🎨 **Real-Time Visualization**: Live bounding boxes with class labels and confidence scores
- 📊 **Performance Monitoring**: Real-time FPS counter and execution provider display
- 🌐 **Offline Capable**: Works without internet after initial load

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: React 18.2 with Hooks
- **Build Tool**: Vite 5.0 (fast HMR and optimized builds)
- **AI Runtime**: ONNX Runtime Web 1.17
- **Execution Provider**: WebGPU (with WebAssembly fallback)
- **Model**: YOLOv8n (80 COCO classes)

### Project Structure

```
realTimeOD/
├── public/
│   └── models/
│       └── yolov8n.onnx          # Place your ONNX model here
├── src/
│   ├── components/
│   │   ├── App.jsx               # Main application component
│   │   ├── CameraView.jsx        # Video display with overlays
│   │   ├── BoundingBoxCanvas.jsx # Detection visualization
│   │   ├── Controls.jsx          # UI controls
│   │   └── FPSMonitor.jsx        # Performance metrics
│   ├── hooks/
│   │   ├── useCamera.js          # Camera management logic
│   │   └── useObjectDetection.js # Detection pipeline logic
│   ├── utils/
│   │   ├── constants.js          # Configuration and constants
│   │   ├── modelLoader.js        # ONNX model loading
│   │   ├── preprocessing.js      # Image preprocessing
│   │   └── postprocessing.js     # NMS and output processing
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- YOLOv8n ONNX model file

### Installation

1. **Clone or navigate to the project directory**:

   ```bash
   cd realTimeOD
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Download the YOLOv8n ONNX model**:

   You can export YOLOv8n to ONNX format using the Ultralytics library:

   ```bash
   pip install ultralytics
   ```

   ```python
   from ultralytics import YOLO

   # Load YOLOv8n model
   model = YOLO('yolov8n.pt')

   # Export to ONNX format
   model.export(format='onnx', opset=12, simplify=True, dynamic=False, imgsz=640)
   ```

   Then move the generated `yolov8n.onnx` file to `public/models/`:

   ```bash
   mkdir -p public/models
   mv yolov8n.onnx public/models/
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

### First-Time Usage

1. Allow camera access when prompted
2. Click **"Load Model"** to initialize the ONNX model
3. Click **"Start Detection"** to begin real-time object detection
4. Use the camera selector to switch between devices
5. Monitor FPS and detection count in the sidebar

## 🎛️ Configuration

### Model Configuration

Edit `src/utils/constants.js` to adjust detection parameters:

```javascript
export const MODEL_CONFIG = {
  modelPath: "/models/yolov8n.onnx",
  inputWidth: 640,
  inputHeight: 640,
  confidenceThreshold: 0.25, // Minimum confidence to show detections
  iouThreshold: 0.45, // IoU threshold for NMS
  maxDetections: 100, // Maximum number of detections
};
```

### Camera Configuration

Adjust camera settings in `src/utils/constants.js`:

```javascript
export const CAMERA_CONFIG = {
  defaultWidth: 640,
  defaultHeight: 480,
  idealWidth: 1280,
  idealHeight: 720,
  facingMode: "user", // 'user' for front, 'environment' for back
};
```

## 📦 Building for Production

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Preview the production build**:
   ```bash
   npm run preview
   ```

The optimized build will be in the `dist/` directory, ready for deployment.

## 🌐 Deployment

### Static Hosting (Recommended)

Deploy to any static hosting service:

- **Netlify**: Drag and drop `dist/` folder or connect Git repo
- **Vercel**: `vercel deploy`
- **GitHub Pages**: Push `dist/` to `gh-pages` branch
- **Cloudflare Pages**: Connect repo and deploy

### Important Deployment Notes

1. **HTTPS Required**: Camera access requires HTTPS in production
2. **Headers for ONNX Runtime**: Some hosts may need CORS headers configured
3. **Model File**: Ensure `yolov8n.onnx` is included in deployment

### Example Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"
```

## 🧪 Testing Different Models

To use a different YOLO model:

1. Export your model to ONNX format with input size 640x640
2. Place it in `public/models/`
3. Update `modelPath` in `src/utils/constants.js`
4. Adjust output processing if using different YOLO version

## 🐛 Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS (or localhost)
- Check browser permissions for camera access
- Try a different browser

### Model Not Loading

- Verify `yolov8n.onnx` exists in `public/models/`
- Check browser console for error messages
- Ensure model was exported correctly

### Low FPS

- Check if WebGPU is enabled (see execution provider in UI)
- Try reducing camera resolution
- Close other GPU-intensive applications
- Consider using a lighter model (YOLOv8n is already the smallest)

### WebGPU Not Available

The app automatically falls back to WebAssembly. Performance will be lower but still functional.

To enable WebGPU:

- Chrome/Edge: Should be enabled by default in version 113+
- Firefox: Not yet supported (use WASM fallback)
- Safari: Limited support, may need enabling in settings

## 🎨 Customization

### Adding Custom Classes

Edit `src/utils/constants.js` to modify the class list:

```javascript
export const COCO_CLASSES = [
  "person",
  "bicycle",
  "car", // ... your classes
];
```

### Changing Colors

Modify the color palette in `src/utils/constants.js`:

```javascript
export const COLORS = [
  "#FF6B6B",
  "#4ECDC4", // ... your colors
];
```

### Styling

All component styles are in separate CSS files:

- `src/App.css` - Main layout
- `src/components/*.css` - Component-specific styles

## 📊 Performance Optimization Tips

1. **Reduce Input Resolution**: Lower resolution = faster inference
2. **Adjust Confidence Threshold**: Higher threshold = fewer detections to process
3. **Use OffscreenCanvas**: Automatically used when available
4. **Optimize Camera Settings**: Lower camera resolution if not needed
5. **Close Unnecessary Tabs**: Free up GPU resources

## 🔒 Privacy & Security

- **No Data Collection**: Nothing is sent to any server
- **Local Processing**: All inference happens on your device
- **No Cookies**: No tracking or analytics
- **Open Source**: Fully inspectable code

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) - Object detection model
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) - Inference engine
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool

## 📞 Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

## 🚀 Future Enhancements

Potential improvements:

- [ ] Multiple model support (YOLOv8s, YOLOv8m, etc.)
- [ ] Video file upload support
- [ ] Screenshot/recording functionality
- [ ] Detection statistics and analytics
- [ ] Custom model training integration
- [ ] Pose estimation support
- [ ] Segmentation support

---

**Built with ❤️ for privacy-conscious AI applications**
