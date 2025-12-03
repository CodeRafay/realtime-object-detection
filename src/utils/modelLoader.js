/**
 * ONNX Model Loader for YOLOv8
 * Handles model loading with ONNXRuntime-Web and WebGPU
 */

import * as ort from 'onnxruntime-web';

/**
 * Initialize ONNX Runtime with WebGPU support
 */
export async function initializeORT() {
  try {
    // Check WebGPU availability
    if (navigator.gpu) {
      console.log('✓ WebGPU is available');
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      return 'webgpu';
    } else {
      console.log('✗ WebGPU not available, falling back to WebAssembly');
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      ort.env.wasm.simd = true;
      return 'wasm';
    }
  } catch (error) {
    console.error('Error initializing ONNX Runtime:', error);
    return 'wasm';
  }
}

/**
 * Load ONNX model
 * @param {string} modelPath - Path to ONNX model
 * @param {string} executionProvider - 'webgpu' or 'wasm'
 * @returns {Promise<ort.InferenceSession>} - Loaded model session
 */
export async function loadModel(modelPath, executionProvider = 'webgpu') {
  try {
    console.log(`Loading model from ${modelPath}...`);
    
    const sessionOptions = {
      executionProviders: executionProvider === 'webgpu' 
        ? ['webgpu', 'wasm']
        : ['wasm'],
      graphOptimizationLevel: 'all',
    };

    // Additional WebGPU options
    if (executionProvider === 'webgpu') {
      sessionOptions.enableCpuMemArena = false;
      sessionOptions.enableMemPattern = false;
    }

    const session = await ort.InferenceSession.create(modelPath, sessionOptions);
    
    console.log('✓ Model loaded successfully');
    console.log('Input names:', session.inputNames);
    console.log('Output names:', session.outputNames);
    
    return session;
  } catch (error) {
    console.error('Error loading model:', error);
    
    // Try fallback to WASM if WebGPU fails
    if (executionProvider === 'webgpu') {
      console.log('Retrying with WebAssembly...');
      return loadModel(modelPath, 'wasm');
    }
    
    throw error;
  }
}

/**
 * Run inference on the model
 * @param {ort.InferenceSession} session - Loaded ONNX session
 * @param {Float32Array} inputTensor - Preprocessed input tensor
 * @param {Array<number>} inputShape - Input shape [batch, channels, height, width]
 * @returns {Promise<Float32Array>} - Model output
 */
export async function runInference(session, inputTensor, inputShape = [1, 3, 640, 640]) {
  try {
    // Create ONNX tensor
    const tensor = new ort.Tensor('float32', inputTensor, inputShape);

    // Get input name from session
    const inputName = session.inputNames[0];

    // Run inference
    const feeds = { [inputName]: tensor };
    const results = await session.run(feeds);

    // Get output (YOLOv8 has single output)
    const outputName = session.outputNames[0];
    const output = results[outputName];

    return output.data;
  } catch (error) {
    console.error('Error during inference:', error);
    throw error;
  }
}

/**
 * Warm up the model with a dummy input
 * This helps optimize first-run performance
 * @param {ort.InferenceSession} session - Loaded ONNX session
 * @param {Array<number>} inputShape - Input shape
 */
export async function warmupModel(session, inputShape = [1, 3, 640, 640]) {
  console.log('Warming up model...');
  const dummyInput = new Float32Array(inputShape.reduce((a, b) => a * b, 1)).fill(0);
  
  try {
    await runInference(session, dummyInput, inputShape);
    console.log('✓ Model warmed up');
  } catch (error) {
    console.warn('Warmup failed (non-critical):', error);
  }
}
