import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { InferenceClient } from '@huggingface/inference';
import { fileTypeFromBuffer } from 'file-type';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const hfToken = process.env.HF_TOKEN;
const imageModel = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.2-klein-9B';
const textModel = process.env.HF_TEXT_MODEL || 'black-forest-labs/FLUX.1-dev';
const hf = hfToken ? new InferenceClient(hfToken) : null;
const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(express.static(__dirname, { extensions: ['html'], index: 'index.html', maxAge: '1h' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Terlalu banyak permintaan dari perangkat ini. Tunggu sebentar lalu coba lagi.' } }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 }, fileFilter: (_req, file, cb) => cb(null, allowedMimes.has(file.mimetype)) });

app.get('/api/health', (_req, res) => res.json({ ok: true, configured: Boolean(hfToken), provider: 'Hugging Face Inference Providers' }));

function unsafePrompt(prompt) {
  // Basic guardrail for explicit sexual requests and instructions to undress people.
  // Provider-side moderation may apply additional checks.
  const patterns = [
    /\b(nude|nudity|fully nude|naked|topless|bare breasts|exposed breasts|nipples?|genitals?|pornographic|explicit sex|sex act|erotic nude)\b/i,
    /\b(remove|take off|strip|erase)\s+(all\s+)?(her|his|their|the person'?s?)?\s*(clothes|clothing|shirt|pants|bra|underwear|dress)\b/i,
    /\b(telanjang|bugil|tanpa busana|buka baju|lepas pakaian|hapus pakaian|puting|alat kelamin|seks eksplisit|pornografi)\b/i
  ];
  return patterns.some(re => re.test(prompt));
}
function addStyle(prompt, style) {
  const safeStyle = String(style || 'photorealistic').slice(0, 80);
  return `${prompt}\nVisual style: ${safeStyle}. High-quality image, coherent anatomy, clean details.`;
}
function sendError(res, status, error) { return res.status(status).json({ error }); }

app.post('/api/generate', upload.single('image'), async (req, res) => {
  if (!hf) return sendError(res, 503, 'Token Hugging Face belum dipasang. Salin .env.example menjadi .env lalu isi HF_TOKEN.');
  const prompt = String(req.body.prompt || '').trim();
  const mode = String(req.body.mode || 'image');
  const style = String(req.body.style || 'photorealistic');
  if (!prompt) return sendError(res, 400, 'Instruksi prompt wajib diisi.');
  if (prompt.length > 1200) return sendError(res, 400, 'Prompt maksimal 1200 karakter.');
  if (!['outfit', 'image', 'character'].includes(mode)) return sendError(res, 400, 'Mode tidak dikenal.');
  if ((mode === 'outfit' || mode === 'image') && !req.file) return sendError(res, 400, 'Mode ini memerlukan gambar sumber.');
  if (unsafePrompt(prompt)) return sendError(res, 400, 'Prompt ini meminta ketelanjangan atau konten seksual eksplisit yang tidak didukung. Coba instruksi edit non-eksplisit seperti outfit, latar, warna, atau pencahayaan.');
  if (req.file) {
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !allowedMimes.has(detected.mime)) return sendError(res, 400, 'Isi file bukan gambar JPG, PNG, atau WebP yang valid.');
  }
  try {
    const fullPrompt = addStyle(prompt, style);
    let output;
    if (req.file) {
      const inputBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
      output = await hf.imageToImage({ data: inputBlob, model: imageModel, parameters: { prompt: fullPrompt, num_inference_steps: 25 } });
    } else {
      output = await hf.textToImage({ model: textModel, inputs: fullPrompt });
    }
    const buffer = Buffer.from(await output.arrayBuffer());
    if (!buffer.length) throw new Error('Model mengembalikan gambar kosong.');
    res.set({ 'Content-Type': output.type && output.type.startsWith('image/') ? output.type : 'image/png', 'Content-Length': String(buffer.length), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[generate]', err?.message || err);
    const raw = String(err?.message || '');
    if (/unauthorized|invalid.*token|401|403/i.test(raw)) return sendError(res, 502, 'Token AI tidak valid atau belum memiliki izin Inference Providers. Periksa HF_TOKEN di file .env.');
    if (/model.*not found|not found|does not exist|404/i.test(raw)) return sendError(res, 502, 'Model tidak ditemukan atau tidak tersedia untuk akun/provider ini. Ganti HF_IMAGE_MODEL atau HF_TEXT_MODEL di .env sesuai model yang tersedia.');
    if (/rate limit|429|quota|credit|payment/i.test(raw)) return sendError(res, 429, 'Batas penggunaan/kredit penyedia AI tercapai. Coba lagi nanti atau periksa kredit akun penyedia.');
    return sendError(res, 502, 'Model AI gagal memproses gambar. Bisa karena model/provider sedang sibuk atau tidak mendukung permintaan ini. Coba lagi; jika berulang, cek log server.');
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return sendError(res, err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 10 MB.' : 'File upload tidak valid.');
  if (err) return sendError(res, 400, 'Permintaan tidak valid.');
});
app.listen(port, () => console.log(`NEPSWE AI berjalan di http://localhost:${port}`));
