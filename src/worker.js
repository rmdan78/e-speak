
import { pipeline, env } from '@xenova/transformers';

// Force local models only
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';

// Set WASM paths - try this format
if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
    env.backends.onnx.wasm.wasmPaths = '/wasm/';
}

class WhisperPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            console.log("Worker: Starting model load...");
            console.log("Worker: localModelPath =", env.localModelPath);
            console.log("Worker: allowRemoteModels =", env.allowRemoteModels);

            this.instance = await pipeline(this.task, this.model, {
                progress_callback,
                quantized: false,
                // Explicitly set cache dir
                cache_dir: '/models/',
            });
            console.log("Worker: Model loaded!");
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const message = event.data;

    if (message.type === 'load') {
        console.log("Worker: Received load message");
        try {
            await WhisperPipeline.getInstance(x => {
                console.log("Worker progress:", x);
                self.postMessage(x);
            });
            self.postMessage({ status: 'ready' });
        } catch (err) {
            console.error("Worker: Load error:", err);
            self.postMessage({ status: 'error', data: String(err) });
        }
    }

    if (message.type === 'generate') {
        try {
            let transcriber = await WhisperPipeline.getInstance();
            let output = await transcriber(message.audio, {
                language: 'english',
                task: 'transcribe',
            });
            self.postMessage({ status: 'complete', output: output });
        } catch (err) {
            console.error("Worker: Generate error:", err);
            self.postMessage({ status: 'error', data: String(err) });
        }
    }
});

console.log("Worker: Script loaded");
