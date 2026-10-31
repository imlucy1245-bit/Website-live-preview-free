import React from 'react';
import {
  RotateCw,
  ExternalLink,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  FileCode,
  ChevronDown
} from 'lucide-react';
import { DeviceViewport } from '../types';

interface PreviewToolbarProps {
  htmlFiles: string[];
  currentHtmlFile: string;
  onSelectHtmlFile: (file: string) => void;
  viewport: DeviceViewport;
  onSelectViewport: (viewport: DeviceViewport) => void;
  onRefresh: () => void;
  onOpenNewTab: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  htmlFiles,
  currentHtmlFile,
  onSelectHtmlFile,
  viewport,
  onSelectViewport,
  onRefresh,
  onOpenNewTab,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const viewports: { id: DeviceViewport; label: string; icon: React.ReactNode; dims: string }[] = [
    { id: 'responsive', label: 'Full', icon: <Maximize2 className="w-3.5 h-3.5" />, dims: '100%' },
    { id: 'desktop', label: 'Desktop', icon: <Monitor className="w-3.5 h-3.5" />, dims: '1280px' },
    { id: 'laptop', label: 'Laptop', icon: <Laptop className="w-3.5 h-3.5" />, dims: '1024px' },
    { id: 'tablet', label: 'Tablet', icon: <Tablet className="w-3.5 h-3.5" />, dims: '768px' },
    { id: 'mobile', label: 'Mobile', icon: <Smartphone className="w-3.5 h-3.5" />, dims: '375px' },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Page Selector & Reload */}
      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Reload preview"
          aria-label="Reload preview"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1 max-w-sm flex items-center">
          <FileCode className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 pointer-events-none" />
          <select
            value={currentHtmlFile}
            onChange={(e) => onSelectHtmlFile(e.target.value)}
            className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
            aria-label="Select active HTML page"
          >
            {htmlFiles.map((file) => (
              <option key={file} value={file}>
                /{file} {file === currentHtmlFile ? '(Active)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {htmlFiles.length} HTML page{htmlFiles.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Device Viewports & Popout */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          {viewports.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectViewport(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                viewport === item.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`${item.label} (${item.dims})`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
            isFullscreen
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800/80 border-transparent hover:bg-slate-700 text-slate-300 hover:text-white'
          }`}
          title={isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Fullscreen Theater Mode'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewTab}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Open preview in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Tab</span>
        </button>
      </div>
    </div>
  );
};
