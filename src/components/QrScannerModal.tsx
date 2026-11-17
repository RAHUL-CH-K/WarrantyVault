import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CheckCircle2,
  QrCode,
  RefreshCw,
  Upload,
  X,
  AlertTriangle,
} from 'lucide-react';
import { parseQrPayload } from '../utils/formatters';
import { SERIAL_STICKER_IMG } from '../data/mockVaultData';

interface QrScannerModalProps {
  open: boolean;
  assetName: string;
  defaultModel: string;
  onClose: () => void;
  onLinked: (
    serialNumber: string,
    model?: string,
    capturedStickerDataUrl?: string
  ) => void;
}

export function QrScannerModal({
  open,
  assetName,
  defaultModel,
  onClose,
  onLinked,
}: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraStatus, setCameraStatus] = useState<
    'starting' | 'active' | 'denied' | 'unavailable'
  >('starting');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [decodedResult, setDecodedResult] = useState<{
    serialNumber: string;
    model?: string;
    rawText: string;
    snapshotUrl?: string;
  } | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setDecodedResult(null);
    setCameraError(null);
    setCameraStatus('starting');

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraStatus('unavailable');
      setCameraError(
        'Camera API is unavailable in this browser context. Upload a sticker photo or test with a sample QR sticker below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus('active');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Camera permission was denied.';
      setCameraStatus('denied');
      setCameraError(
        `${msg} You can upload a QR sticker photo or use a sample test QR code below.`
      );
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [open]);

  // Frame decode loop
  useEffect(() => {
    if (!open || cameraStatus !== 'active' || decodedResult) return;

    let cancelled = false;
    const BarcodeDetectorCtor = (
      window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => {
          detect: (
            source: HTMLVideoElement | HTMLCanvasElement
          ) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;
    const detector = BarcodeDetectorCtor
      ? new BarcodeDetectorCtor({ formats: ['qr_code'] })
      : null;

    const scanFrame = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);

          // 1. Try native BarcodeDetector first if supported
          if (detector) {
            try {
              const codes = await detector.detect(canvas);
              if (codes.length > 0 && codes[0].rawValue) {
                const parsed = parseQrPayload(codes[0].rawValue);
                const snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
                setDecodedResult({ ...parsed, snapshotUrl });
                stopCamera();
                return;
              }
            } catch {
              // fallback to jsQR
            }
          }

          // 2. jsQR software decode fallback
          const imgData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imgData.data, w, h, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            const parsed = parseQrPayload(code.data);
            const snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
            setDecodedResult({ ...parsed, snapshotUrl });
            stopCamera();
            return;
          }
        }
      }

      rafRef.current = requestAnimationFrame(scanFrame);
    };

    rafRef.current = requestAnimationFrame(scanFrame);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, cameraStatus, decodedResult]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const dataUrl = reader.result;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const decoded = jsQR(imgData.data, img.width, img.height);
        if (decoded && decoded.data) {
          const parsed = parseQrPayload(decoded.data);
          setDecodedResult({ ...parsed, snapshotUrl: dataUrl });
          stopCamera();
        } else {
          setCameraError(
            'No QR code detected in that image. Try a sharper angle or test with the simulated QR sticker.'
          );
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateQr = (payload: string) => {
    const parsed = parseQrPayload(payload);
    setDecodedResult({
      ...parsed,
      snapshotUrl: SERIAL_STICKER_IMG,
    });
    stopCamera();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan serial sticker QR code"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Scan Serial Sticker QR
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[230px]">
                Linking to {assetName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Close QR scanner"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera Viewfinder or Decoded Confirmation */}
          {!decodedResult ? (
            <>
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    cameraStatus === 'active' ? 'opacity-100' : 'opacity-20'
                  }`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Reticle overlay */}
                {cameraStatus === 'active' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 relative">
                      <span className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                      <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                      <span className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                      <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
                    </div>
                    <p className="absolute bottom-3 px-3 py-1 rounded-lg bg-slate-950/75 text-white text-xs">
                      Point camera at appliance QR or warranty card
                    </p>
                  </div>
                )}

                {cameraStatus === 'starting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs gap-2">
                    <Camera className="w-6 h-6 animate-pulse text-teal-400" />
                    <span>Starting camera viewfinder…</span>
                  </div>
                )}

                {(cameraStatus === 'denied' || cameraStatus === 'unavailable') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center text-white">
                    <AlertTriangle className="w-7 h-7 text-amber-400 mb-2" />
                    <p className="text-sm font-medium">
                      Live camera unavailable
                    </p>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-3 min-h-[44px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {cameraError && cameraStatus === 'active' && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  {cameraError}
                </p>
              )}

              {/* Upload QR Sticker or Simulate Scan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-[#0F766E]" />
                  <span>Upload QR Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSimulateQr(
                      `{"sn":"PV-${defaultModel.replace(/[^A-Z0-9]/gi, '').slice(0, 5)}-90418","model":"${defaultModel}"}`
                    )
                  }
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#0F766E] text-xs font-medium inline-flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Test Sample Sticker QR</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-emerald-950">
                    QR Code Decoded Successfully
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5 break-all font-mono">
                    {decodedResult.rawText}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#FAFAF7] p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Extracted Serial No.
                  </span>
                  <p className="text-sm font-semibold font-mono text-slate-900 mt-0.5">
                    {decodedResult.serialNumber}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Model Reference
                  </span>
                  <p className="text-sm font-semibold font-mono text-slate-900 mt-0.5">
                    {decodedResult.model || defaultModel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Scan Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLinked(
                      decodedResult.serialNumber,
                      decodedResult.model,
                      decodedResult.snapshotUrl
                    );
                    onClose();
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59] transition-colors"
                >
                  Link Serial to Asset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
