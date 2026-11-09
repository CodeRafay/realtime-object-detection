/**
 * ONNX Model Loader (YOLO-family models)
 * Tries WebGPU first, falls back to multi-threaded WebAssembly. All ORT calls are serialized.
 */

// The /webgpu bundle is the one that ships the WebGPU execution provider.
import * as ort from 'onnxruntime-web/webgpu';

// With WebGPU the WASM threads do no useful work and overlapping calls can deadlock the main
// thread, so use 1. Without WebGPU use all cores (needs COOP/COEP cross-origin isolation).
// shortcut: if a GPU exists but the WebGPU EP fails, the WASM fallback runs single-threaded
// (threads can only be set before the first session); rare, revisit if it shows up in the wild.
ort.env.wasm.numThreads = navigator.gpu ? 1 : navigator.hardwareConcurrency || 4;

// ORT Web runs on a single WASM instance: overlapping create/run/release calls (e.g. switching
// models while a frame is still inferring) can hang the page. Every ORT call goes through this queue.
let queue = Promise.resolve();
const serial = (fn) => {
  const result = queue.then(fn);
  queue = result.catch(() => {});
  return result;
};

/**
 * Load an ONNX model.
 * @param {string} modelPath
 * @returns {Promise<{session: ort.InferenceSession, provider: 'webgpu'|'wasm'}>}
 */
export function loadModel(modelPath) {
  return serial(() => createSession(modelPath));
}

/** Free a session's GPU/WASM memory, after any inference already queued on it. */
export function releaseModel(session) {
  return serial(() => session.release()).catch((error) => console.warn('Release failed:', error));
}

async function createSession(modelPath) {
  if (navigator.gpu) {
    try {
      const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all',
      });
      console.log('✓ Model loaded on WebGPU');
      return { session, provider: 'webgpu' };
    } catch (error) {
      console.warn('WebGPU failed, falling back to WebAssembly:', error);
    }
  }

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  console.log(`✓ Model loaded on WebAssembly (${ort.env.wasm.numThreads} threads, isolated: ${self.crossOriginIsolated})`);
  return { session, provider: 'wasm' };
}

/**
 * Run inference.
 * @param {ort.InferenceSession} session
 * @param {Float32Array} inputTensor - CHW float input
 * @param {Array<number>} inputShape - [1, 3, H, W]
 * @returns {Promise<{data: Float32Array, dims: number[]}>} first model output
 */
export async function runInference(session, inputTensor, inputShape) {
  const tensor = new ort.Tensor('float32', inputTensor, inputShape);
  const results = await serial(() => session.run({ [session.inputNames[0]]: tensor }));
  // Seg models (YOLOE) also return mask protos as a second output; only the first is used.
  const { data, dims } = results[session.outputNames[0]];
  return { data, dims };
}

/**
 * Warm up the model with a dummy input (first run compiles GPU shaders).
 */
export async function warmupModel(session, inputShape) {
  try {
    await runInference(session, new Float32Array(inputShape.reduce((a, b) => a * b, 1)), inputShape);
  } catch (error) {
    console.warn('Warmup failed (non-critical):', error);
  }
}
