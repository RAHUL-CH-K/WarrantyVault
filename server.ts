import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'warrantyvault-api' });
  });

  app.post('/api/animate-video', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Add a billing-enabled key in Settings > Secrets to generate videos with gemini-omni-1.2-flash.',
      });
    }

    try {
      const { imageBase64, mimeType, aspectRatio, prompt } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        aspectRatio?: string;
        prompt?: string;
      };

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({
          error: 'Please upload or select an image before generating a video.',
        });
      }

      const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
      const motionPrompt =
        prompt && prompt.trim().length > 0
          ? prompt.trim()
          : 'Smooth subtle handheld inspection camera pan across the product and label details, crisp natural studio lighting, realistic motion.';

      const ai = new GoogleGenAI({ apiKey });

      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: [
            {
              type: 'image',
              mime_type: mimeType,
              data: imageBase64,
            },
            {
              type: 'text',
              text: motionPrompt,
            },
          ],
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: validAspectRatio,
          },
        },
        { timeout: 300000 }
      );

      let videoPart = interaction.output_video;
      if (!videoPart && Array.isArray(interaction.steps)) {
        for (const step of interaction.steps) {
          if (step.type === 'model_output' && Array.isArray(step.content)) {
            const found = step.content.find((c) => c.type === 'video');
            if (found && found.type === 'video') {
              videoPart = found;
            }
          }
        }
      }

      if (!videoPart) {
        return res.status(502).json({
          error: 'Video generation completed without a video output payload.',
        });
      }

      let videoBase64 = videoPart.data;
      const outputMimeType = videoPart.mime_type || 'video/mp4';

      if (!videoBase64 && videoPart.uri) {
        const uriResponse = await fetch(videoPart.uri, {
          headers: { 'x-goog-api-key': apiKey },
        });
        if (!uriResponse.ok) {
          throw new Error(
            `Failed to download generated video artifact (${uriResponse.status})`
          );
        }
        const arrayBuffer = await uriResponse.arrayBuffer();
        videoBase64 = Buffer.from(arrayBuffer).toString('base64');
      }

      if (!videoBase64) {
        return res.status(502).json({
          error: 'Video payload was empty in Gemini Interactions API response.',
        });
      }

      return res.json({
        videoBase64,
        mimeType: outputMimeType,
        aspectRatio: validAspectRatio,
      });
    } catch (error: unknown) {
      console.error('Video generation error:', error);
      const errObj = error as { status?: number; message?: string };
      const status = typeof errObj?.status === 'number' ? errObj.status : 500;
      let message =
        errObj?.message || 'Unexpected error while generating video.';

      if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
        message =
          'Quota exceeded or billing-enabled API key required for gemini-omni-1.2-flash. Update GEMINI_API_KEY in Settings > Secrets with a paid-tier key.';
      } else if (status === 403 || status === 401) {
        message =
          'API key rejected for gemini-omni-1.2-flash. Check Settings > Secrets for a valid billing-enabled GEMINI_API_KEY.';
      }

      return res.status(status >= 400 && status < 600 ? status : 500).json({
        error: message,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WarrantyVault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
