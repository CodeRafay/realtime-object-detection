# 🏗️ System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      React Application                      │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   Camera     │  │   Controls   │  │     FPS      │    │  │
│  │  │     View     │  │              │  │   Monitor    │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              Bounding Box Canvas                      │  │  │
│  │  │          (Detection Visualization)                    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────┐         ┌───────────────────────┐    │  │
│  │  │   useCamera     │         │  useObjectDetection   │    │  │
│  │  │   (Hook)        │         │      (Hook)           │    │  │
│  │  └─────────────────┘         └───────────────────────┘    │  │
│  │          │                               │                  │  │
│  └──────────┼───────────────────────────────┼─────────────────┘  │
│             │                               │                    │
│  ┌──────────▼───────────┐       ┌──────────▼───────────────┐   │
│  │   Browser Camera     │       │   ONNX Runtime Web       │   │
│  │         API          │       │   (WebGPU/WASM)          │   │
│  └──────────────────────┘       └──────────────────────────┘   │
│                                              │                   │
│                                   ┌──────────▼──────────┐        │
│                                   │   GPU/CPU Hardware  │        │
│                                   └─────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────┐
│   Camera    │
│  Hardware   │
└──────┬──────┘
       │ Video Stream
       ▼
┌──────────────┐
│   Video      │
│   Element    │
└──────┬───────┘
       │ Frame
       ▼
┌──────────────────┐
│  Preprocessing   │
│  - Letterbox     │
│  - Normalize     │
│  - CHW Format    │
└──────┬───────────┘
       │ Tensor [1,3,384,640]
       ▼
┌──────────────────┐
│  ONNX Runtime    │
│  - WebGPU/WASM   │
│  - YOLO26n/s or  │
│    YOLOE-26s     │
└──────┬───────────┘
       │ Output [1,4+classes,5040]
       ▼
┌──────────────────┐
│ Postprocessing   │
│  - Parse Output  │
│  - NMS           │
│  - Scale Boxes   │
└──────┬───────────┘
       │ Detections Array
       ▼
┌──────────────────┐
│  Tracker         │
│  - Stable IDs    │
│  - Velocity      │
│  - Min-conf gate │
└──────┬───────────┘
       │ predict(now), every display frame
       ▼
┌──────────────────┐
│  Canvas Drawing  │
│  - Bounding Boxes│
│  - Labels + IDs  │
│  - Confidence    │
└──────────────────┘
```

Inference runs once per new video frame; drawing runs at display rate and extrapolates
boxes in between, so they move smoothly even when the model manages only a few runs per second.

## Component Hierarchy

```
App.jsx
├── CameraView.jsx
│   ├── <video> element
│   └── BoundingBoxCanvas.jsx
│       └── <canvas> element
│
├── Controls.jsx
│   ├── Model controls (load, start/stop, Quality tier, Min confidence slider)
│   ├── Camera selector
│   └── Video file upload
│
├── FPSMonitor.jsx
│
└── InfoBox (inline)
```

## Hook Dependencies

```
useCamera
├── useState (stream, error, devices, etc.)
├── useEffect (device enumeration)
├── useEffect (cleanup)
├── useRef (videoRef)
└── Functions:
    ├── startCamera()
    ├── stopCamera()
    ├── switchCamera()
    └── changeCamera()

useObjectDetection
├── useState (model, isLoading, isRunning, fps, detectionCount, threshold, error)
├── useEffect (stop loop on unmount)
├── useRef (loopIdRef, trackerRef, modelRef, thresholdRef)
├── useCallback (initializeModel(tier?))
├── useCallback (detectObjects)
├── useCallback (startDetection)
├── useCallback (stopDetection)
├── useCallback (setThreshold)
└── useCallback (getTracks(now)) → read by BoundingBoxCanvas every display frame
```

## Utility Module Structure

```
utils/
│
├── constants.js
│   ├── COCO_CLASSES[]
│   ├── COLORS[]
│   ├── MODELS{fast, accurate, more}
│   ├── MODEL_CONFIG{}
│   └── CAMERA_CONFIG{}
│
├── modelLoader.js          (every ORT call goes through one serial queue)
│   ├── loadModel()
│   ├── releaseModel()
│   ├── runInference()
│   └── warmupModel()
│
├── preprocessing.js
│   └── preprocessImage()   (reuses one canvas + tensor buffer)
│
├── postprocessing.js
│   ├── calculateIoU()
│   ├── nonMaxSuppression()
│   ├── processOutput()     (output shape read from the model)
│   └── scaleDetections()
│
└── tracker.js
    └── createTracker() → { update(detections, now, minConf), predict(now) }
```

## Execution Flow

```
1. Application Loads
   └── React renders UI
       └── useCamera initializes
           └── Camera stream starts

2. User Clicks "Load Model"
   └── initializeModel()
       ├── loadModel(Fast) + labels   [WebGPU, else WASM]
       ├── warmupModel() + time 3 runs
       └── if fast enough: load Accurate, release Fast

3. User Clicks "Start Detection"
   ├── startDetection()
   │   └── detectLoop() [once per new video frame: requestVideoFrameCallback]
   │       ├── preprocessImage()     letterbox → CHW tensor
   │       ├── runInference()        ONNX Runtime (serialized)
   │       ├── processOutput()       decode + NMS
   │       ├── scaleDetections()     back to video pixels
   │       ├── tracker.update()      IDs, velocity, min-confidence gate
   │       └── once per second: update det/s + object count
   │
   └── BoundingBoxCanvas draw loop [requestAnimationFrame, display rate]
       └── draw getTracks(performance.now())  extrapolated boxes

4. User Changes Quality
   └── stopDetection() → initializeModel(tier) → old session released after any queued run

5. User Clicks "Stop Detection"
   └── stopDetection()
       └── Loop id bumped (in-flight run exits), tracker dropped, draw loop cancelled
```

## State Management

```
App Level State:
├── Camera State (useCamera)
│   ├── stream
│   ├── devices
│   ├── selectedDeviceId
│   ├── error
│   └── isInitialized
│
├── Video File State (App)
│   └── videoFileUrl
│
└── Detection State (useObjectDetection)
    ├── model { session, provider, cfg, tier, labels, ms }
    ├── isLoading
    ├── isRunning
    ├── fps (detections/sec)
    ├── detectionCount
    ├── threshold (Min confidence)
    └── error

Per-frame data (tracks) lives in a ref, not React state, so drawing never re-renders React.
```

## Performance Optimization Points

```
1. Preprocessing
   └── One reused canvas + tensor buffer
       └── 640×384 input fits 16:9 video with little padding

2. Inference
   └── WebGPU execution provider, fp16 models
       └── Fallback to multi-threaded WebAssembly
           └── One video frame → at most one run (requestVideoFrameCallback)

3. Rendering
   └── Separate requestAnimationFrame draw loop
       └── Boxes extrapolated between detections
           └── No React re-render per frame

4. Memory Management
   └── Reused buffers; old model sessions released when switching tiers
```

## Browser API Usage

```
┌────────────────────────────────┐
│      Browser APIs Used          │
├────────────────────────────────┤
│ • navigator.mediaDevices       │ Camera access
│ • getUserMedia()                │ Video stream
│ • enumerateDevices()            │ Device list
│ • HTMLVideoElement              │ Video display
│ • HTMLCanvasElement             │ Drawing
│ • CanvasRenderingContext2D      │ 2D graphics
│ • requestVideoFrameCallback     │ Inference loop
│ • requestAnimationFrame         │ Drawing loop
│ • performance.now()             │ Timing / tracking
│ • URL.createObjectURL()         │ Video upload
│ • navigator.gpu                 │ WebGPU check
│ • WebGPU API                    │ GPU compute
└────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         CDN / Static Hosting             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │         Static Assets               │ │
│  │  • index.html                       │ │
│  │  • JavaScript bundle                │ │
│  │  • CSS files                        │ │
│  │  • ONNX models (5-21 MB)            │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │      Edge Locations (Global)        │ │
│  │  • Netlify / Vercel / Cloudflare   │ │
│  │  • Automatic HTTPS                  │ │
│  │  • Instant scaling                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│          User's Browser                  │
│  • Downloads app (one-time)              │
│  • Caches models                         │
│  • Runs 100% locally                     │
│  • No further server contact             │
└─────────────────────────────────────────┘
```

## Security & Privacy Architecture

```
┌──────────────────────────────────────┐
│       Privacy Guarantees              │
├──────────────────────────────────────┤
│                                       │
│  ┌─────────────────────────────┐    │
│  │    User's Device              │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │   Camera                 │ │    │
│  │  └──────────┬───────────────┘ │    │
│  │             │ Local only      │    │
│  │             ▼                 │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │   Browser Memory         │ │    │
│  │  │  • Video frames          │ │    │
│  │  │  • Model inference       │ │    │
│  │  │  • Detections           │ │    │
│  │  └─────────────────────────┘ │    │
│  │             │                 │    │
│  │             ▼                 │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │   Screen Display         │ │    │
│  │  └─────────────────────────┘ │    │
│  └─────────────────────────────┘    │
│                                       │
│  ❌ No Network Transmission           │
│  ❌ No Server Processing              │
│  ❌ No Data Storage                   │
│  ❌ No Video Uploads                  │
│  ❌ No Cookies                        │
│                                       │
└──────────────────────────────────────┘
```

The deployed site uses Vercel Web Analytics (anonymous page views). Camera and video frames never leave the device.

## Technology Stack Layers

```
┌─────────────────────────────────────┐
│        Presentation Layer            │  React Components
├─────────────────────────────────────┤
│        Business Logic Layer          │  Custom Hooks
├─────────────────────────────────────┤
│        Data Processing Layer         │  Utility Functions
├─────────────────────────────────────┤
│        AI Inference Layer            │  ONNX Runtime Web
├─────────────────────────────────────┤
│        Execution Layer               │  WebGPU / WebAssembly
├─────────────────────────────────────┤
│        Hardware Layer                │  GPU / CPU
└─────────────────────────────────────┘
```

---

This architecture provides:

- ✅ Clear separation of concerns
- ✅ Modular and maintainable code
- ✅ High performance
- ✅ Privacy by design
- ✅ Scalable to unlimited users
- ✅ Zero operational cost
