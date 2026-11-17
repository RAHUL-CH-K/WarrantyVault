import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  Film,
  Loader2,
  RectangleHorizontal,
  RectangleVertical,
  Upload,
} from 'lucide-react';
import { AnimatedVideoClip } from '../types/vault';

interface VideoAnimatorPanelProps {
  assetName: string;
  defaultImageUrl: string;
  stickerImageUrl: string | null;
  clips: AnimatedVideoClip[];
  onClipGenerated: (clip: AnimatedVideoClip) => void;
}

async function imageUrlToBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read image data'));
        return;
      }
      const commaIdx = reader.result.indexOf(',');
      resolve({
        base64: commaIdx >= 0 ? reader.result.slice(commaIdx + 1) : reader.result,
        mimeType,
      });
    };
    reader.onerror = () => reject(new Error('Failed to encode image'));
    reader.readAsDataURL(blob);
  });
}

export function VideoAnimatorPanel({
  assetName,
  defaultImageUrl,
  stickerImageUrl,
  clips,
  onClipGenerated,
}: VideoAnimatorPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPreview, setSelectedPreview] = useState<string>(
    stickerImageUrl || defaultImageUrl
  );
  const [uploadedBase64, setUploadedBase64] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState(
    'Slow steady inspection camera pan across the appliance and serial label under bright indoor lighting.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a JPG, PNG, or WEBP image file.');
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedPreview(reader.result);
        const commaIdx = reader.result.indexOf(',');
        setUploadedBase64({
          base64:
            commaIdx >= 0 ? reader.result.slice(commaIdx + 1) : reader.result,
          mimeType: file.type || 'image/jpeg',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectAssetPhoto = (url: string) => {
    setSelectedPreview(url);
    setUploadedBase64(null);
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const payload = uploadedBase64
        ? uploadedBase64
        : await imageUrlToBase64(selectedPreview);

      const res = await fetch('/api/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payload.base64,
          mimeType: payload.mimeType,
          aspectRatio,
          prompt,
        }),
      });

      const data = (await res.json()) as {
        videoBase64?: string;
        mimeType?: string;
        aspectRatio?: '16:9' | '9:16';
        error?: string;
      };

      if (!res.ok || !data.videoBase64) {
        throw new Error(
          data.error || 'Video generation failed. Please try again.'
        );
      }

      const dataUrl = `data:${data.mimeType || 'video/mp4'};base64,${data.videoBase64}`;
      onClipGenerated({
        id: `vid-${Date.now()}`,
        dataUrl,
        aspectRatio: data.aspectRatio || aspectRatio,
        prompt,
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to animate image into video right now.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Animate Photo into Video Proof
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn an appliance or receipt photo into a short inspection video for warranty claims
            </p>
          </div>
        </div>
      </div>

      {/* Source Photo Selection */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-600">
          Source Frame
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-[#FAFAF7] hover:bg-slate-100 text-slate-800 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-[#0F766E]" />
            <span>Upload Photo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAssetPhoto(defaultImageUrl)}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
              !uploadedBase64 && selectedPreview === defaultImageUrl
                ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Use Restored Invoice
          </button>

          {stickerImageUrl && (
            <button
              type="button"
              onClick={() => handleSelectAssetPhoto(stickerImageUrl)}
              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                !uploadedBase64 && selectedPreview === stickerImageUrl
                  ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Use Serial Sticker
            </button>
          )}
        </div>
      </div>

      {/* Preview + Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        <div className="sm:col-span-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3">
          <img
            src={selectedPreview}
            alt={`Selected source photo for ${assetName}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="sm:col-span-8 space-y-3">
          {/* Aspect Ratio Toggle (Strictly 16:9 or 9:16) */}
          <div>
            <span className="block text-xs font-medium text-slate-600 mb-1.5">
              Video Aspect Ratio
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                  aspectRatio === '16:9'
                    ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RectangleHorizontal className="w-4 h-4" />
                <span>16:9 Landscape</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                  aspectRatio === '9:16'
                    ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RectangleVertical className="w-4 h-4" />
                <span>9:16 Portrait</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Motion Instruction
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe camera motion or inspection focus..."
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Video (may take ~30–90s)…</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>Generate {aspectRatio} Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error feedback */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Generated Clips */}
      {clips.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <p className="text-xs font-semibold text-slate-700">
            Generated Claim Videos ({clips.length})
          </p>
          <div className="grid grid-cols-1 gap-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="rounded-xl border border-slate-200 bg-[#FAFAF7] p-3 space-y-2"
              >
                <div
                  className={`mx-auto rounded-lg overflow-hidden bg-slate-950 ${
                    clip.aspectRatio === '9:16'
                      ? 'max-w-[240px] aspect-9/16'
                      : 'w-full aspect-video'
                  }`}
                >
                  <video
                    src={clip.dataUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 truncate">
                    {clip.aspectRatio} · {clip.prompt}
                  </span>
                  <a
                    href={clip.dataUrl}
                    download={`${assetName.toLowerCase().replace(/\s+/g, '_')}_${clip.aspectRatio.replace(':', 'x')}.mp4`}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
