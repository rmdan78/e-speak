
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelId = 'Xenova/whisper-tiny.en';
const remoteUrl = `https://huggingface.co/${modelId}/resolve/main/`;
const files = [
    'config.json',
    'tokenizer.json',
    'preprocessor_config.json',
    'encoder_model_quantized.onnx',
    'decoder_model_merged_quantized.onnx',
];

const destDir = path.join(__dirname, '../public/models', modelId);

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

console.log(`Downloading model ${modelId} to ${destDir}...`);

const downloadFile = (file) => {
    return new Promise((resolve, reject) => {
        const destPath = path.join(destDir, file);
        if (fs.existsSync(destPath)) {
            console.log(`  - ${file} (already exists)`);
            resolve();
            return;
        }

        const fileStream = fs.createWriteStream(destPath);
        console.log(`  - Downloading ${file}...`);

        https.get(remoteUrl + file, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download ${file}: ${res.statusCode}`));
                return;
            }
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`  - Downloaded ${file}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Delete partial file
            reject(err);
        });
    });
};

const main = async () => {
    try {
        for (const file of files) {
            await downloadFile(file);
        }
        console.log('All model files downloaded successfully!');
    } catch (err) {
        console.error('Download failed:', err);
    }
};

main();
