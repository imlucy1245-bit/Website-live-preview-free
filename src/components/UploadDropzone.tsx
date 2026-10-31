import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, Sparkles, ShieldCheck, Layers, Smartphone, ArrowRight, Gamepad2, Globe, Scan } from 'lucide-react';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onLoadScannerDemo: () => void;
  onLoadSaasDemo: () => void;
  onLoadGameDemo: () => void;
  isLoading: boolean;
  loadingMessage: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelect,
  onLoadScannerDemo,
  onLoadSaasDemo,
  onLoadGameDemo,
  isLoading,
  loadingMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndProcess = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
      setErrorMessage('Please upload a valid .zip archive containing website files.');
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Instant Website ZIP Extractor & Live Preview</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Upload ZIP, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Preview Live Site</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Apni kisi bhi website ya scanner app ka code ZIP file upload karein. Hamari app usay extract kar ke images aur multi-page navigation ke saath live preview dikha degi.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`w-full max-w-2xl relative rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
          aria-label="Upload website ZIP archive"
        />

        {isLoading ? (
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <div className="text-slate-200 font-semibold">{loadingMessage || 'Extracting ZIP & resolving assets...'}</div>
            <p className="text-slate-400 text-sm">Resolving Images, CSS, Scripts, and Viewports</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="w-8 h-8 text-indigo-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              Drag & drop your website <span className="text-indigo-400">.ZIP</span> here
            </h3>
            <p className="text-slate-400 text-sm mb-5">
              or click to browse files from your computer
            </p>

            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileArchive className="w-4 h-4" />
              <span>Select ZIP File</span>
            </button>

            <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Client-side (No server upload)
              </span>
              <span>•</span>
              <span>Images & redirects auto-resolved</span>
            </div>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Demo Starters */}
      <div className="w-full max-w-2xl mt-8 pt-8 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Or Try A One-Click Demo Project:
          </span>
          <span className="text-xs text-slate-500">Instant test</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onLoadScannerDemo}
            disabled={isLoading}
            className="flex flex-col p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mb-2.5 group-hover:scale-105 transition-transform">
              <Scan className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between w-full">
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                QR & Scanner App
              </h4>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-all" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              With embedded image assets, laser viewfinder & multi-page navigation.
            </p>
          </button>

          <button
            type="button"
            onClick={onLoadSaasDemo}
            disabled={isLoading}
            className="flex flex-col p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mb-2.5 group-hover:scale-105 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between w-full">
              <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                Multi-Page SaaS
              </h4>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-all" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              4 linked pages (Home, Features, Pricing, Contact) with CSS styling.
            </p>
          </button>

          <button
            type="button"
            onClick={onLoadGameDemo}
            disabled={isLoading}
            className="flex flex-col p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/50 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 mb-2.5 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between w-full">
              <h4 className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                Neon Arcade
              </h4>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-pink-400 transition-all" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              Playable HTML5 Canvas asteroid game with score & controls.
            </p>
          </button>
        </div>
      </div>

      {/* Feature cards below */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <Layers className="w-5 h-5 text-indigo-400 mb-2.5" />
          <h4 className="text-sm font-bold text-white mb-1">Deep Image Resolution</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Resolves &lt;img src&gt;, srcset, inline CSS background URLs, SVGs, and case-mismatched filenames from your ZIP.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <Smartphone className="w-5 h-5 text-purple-400 mb-2.5" />
          <h4 className="text-sm font-bold text-white mb-1">Anti-Redirect Guard</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Neutralizes frame-busters and keeps multi-page relative navigation inside the virtual filesystem.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2.5" />
          <h4 className="text-sm font-bold text-white mb-1">Private & Sandboxed</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All files are extracted directly inside your browser. No files are uploaded to any external server.
          </p>
        </div>
      </div>
    </div>
  );
};
