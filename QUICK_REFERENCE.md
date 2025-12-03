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
```

## 📁 Key File Locations

```
Configuration:     vite.config.js, package.json
Main App:          src/App.jsx
Camera Logic:      src/hooks/useCamera.js
Detection Logic:   src/hooks/useObjectDetection.js
Model Settings:    src/utils/constants.js
Documentation:     README.md, DEPLOYMENT.md
```

## 🎯 Common Tasks

### Change Detection Threshold

**File**: `src/utils/constants.js`

```javascript
confidenceThreshold: 0.25; // Lower = more detections
```

### Change Camera Resolution

**File**: `src/utils/constants.js`

```javascript
idealWidth: 1280; // Lower = better performance
idealHeight: 720;
```

### Change Model

**File**: `src/utils/constants.js`

```javascript
modelPath: "/models/yolov8n.onnx"; // Update filename
```

### Add Custom Classes

**File**: `src/utils/constants.js`

```javascript
export const COCO_CLASSES = [
  "class1",
  "class2", // ... your classes
];
```

## 🐛 Troubleshooting Quick Fixes

### Camera not working

```javascript
// Check in browser console:
navigator.mediaDevices.getUserMedia({ video: true });
```

### Model not loading

```bash
# Verify file exists:
dir public\models\yolov8n.onnx
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

```javascript
// src/utils/constants.js
inputWidth: 416,   // Smaller = faster
inputHeight: 416,
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

## 📊 Performance Targets

| Device  | Target FPS | Input Size |
| ------- | ---------- | ---------- |
| Laptop  | 40-60      | 640x640    |
| Mobile  | 20-30      | 640x640    |
| Low-end | 10-20      | 416x416    |

## 🌐 Browser Requirements

✅ Chrome 113+, Edge 113+ (WebGPU)
⚠️ Firefox, Safari (WebAssembly fallback)

## 📦 Deployment Checklist

- [ ] Model file in `public/models/`
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
2. Lower camera resolution for better FPS
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
