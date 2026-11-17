import { useState } from 'react';
import {
  Maximize2,
  QrCode,
  SlidersHorizontal,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
  FileText,
  Tag,
} from 'lucide-react';

interface PhotoViewerProps {
  invoiceOriginalUrl: string;
  invoiceRestoredUrl: string;
  serialStickerUrl: string | null;
  productName: string;
  onOpenQrScanner?: () => void;
}

export function PhotoViewer({
  invoiceOriginalUrl,
  invoiceRestoredUrl,
  serialStickerUrl,
  productName,
  onOpenQrScanner,
}: PhotoViewerProps) {
  const [activeTab, setActiveTab] = useState<'invoice' | 'sticker'>('invoice');
  const [viewMode, setViewMode] = useState<'slider' | 'fade_fixed' | 'original'>(
    'slider'
  );
  const [sliderPos, setSliderPos] = useState(55);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));

  const renderViewerCanvas = (isFullscreen = false) => {
    if (activeTab === 'sticker') {
      if (!serialStickerUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-[360px] sm:h-[420px] bg-orange-50/40 border border-dashed border-orange-300 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Serial sticker photo missing
            </h4>
            <p className="mt-1 text-xs text-slate-600 max-w-xs">
              Scan the QR code or barcode sticker on the back of your appliance to reach 100% claim readiness.
            </p>
            {onOpenQrScanner && (
              <button
                type="button"
                onClick={onOpenQrScanner}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Serial QR</span>
              </button>
            )}
          </div>
        );
      }

      return (
        <div
          className={`relative overflow-auto rounded-xl bg-slate-100 border border-slate-200 ${
            isFullscreen ? 'h-[72vh]' : 'h-[360px] sm:h-[420px]'
          }`}
        >
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-150"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <img
              src={serialStickerUrl}
              alt={`${productName} serial number sticker`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-slate-100 border border-slate-200 select-none ${
          isFullscreen ? 'h-[72vh]' : 'h-[360px] sm:h-[420px]'
        }`}
      >
        {viewMode === 'slider' ? (
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            {/* Base: Fade-Fixed Restored Invoice */}
            <img
              src={invoiceRestoredUrl}
              alt={`${productName} fade-fixed restored invoice`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain bg-white"
            />

            {/* Clipped Overlay: Original Faded Thermal Bill */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={invoiceOriginalUrl}
                alt={`${productName} original bill photo`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-amber-50/40"
              />
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#0F766E] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0F766E] text-white shadow-md flex items-center justify-center border-2 border-white">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Labels */}
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/75 text-white text-[11px] font-medium pointer-events-none">
              Original
            </span>
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#0F766E]/90 text-white text-[11px] font-medium pointer-events-none">
              Fade-Fixed
            </span>

            <input
              type="range"
              min={5}
              max={95}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Slide to compare Original vs Fade-Fixed invoice"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-150"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <img
              src={
                viewMode === 'fade_fixed' ? invoiceRestoredUrl : invoiceOriginalUrl
              }
              alt={`${productName} ${
                viewMode === 'fade_fixed' ? 'fade-fixed' : 'original'
              } invoice`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
      {/* Top tabs + mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('invoice');
              setZoom(1);
            }}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'invoice'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Restored Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('sticker');
              setZoom(1);
            }}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'sticker'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Serial Sticker</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono tabular-nums text-slate-600 px-1.5">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 2.5}
            aria-label="Zoom in"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Open fullscreen viewer"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Original vs Fade-Fixed Switcher when on Invoice tab */}
      {activeTab === 'invoice' && (
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <span className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Compare enhancement</span>
          </span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'slider'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Slider
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'original'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => setViewMode('fade_fixed')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'fade_fixed'
                  ? 'bg-white text-[#0F766E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fade-Fixed
            </button>
          </div>
        </div>
      )}

      {renderViewerCanvas(false)}

      {/* Fullscreen Lightbox */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen document viewer"
        >
          <div className="w-full max-w-4xl bg-white rounded-2xl p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {productName} —{' '}
                  {activeTab === 'invoice' ? 'Invoice Proof' : 'Serial Sticker'}
                </h3>
                <p className="text-xs text-slate-500">
                  Drag slider or adjust zoom to inspect thermal bill legibility
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                aria-label="Close fullscreen"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderViewerCanvas(true)}
          </div>
        </div>
      )}
    </div>
  );
}
