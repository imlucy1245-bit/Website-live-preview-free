import React, { useMemo, useEffect, useRef, useState } from 'react';
import { DeviceViewport, ZipProject, ConsoleLogMessage } from '../types';
import { prepareHtmlForPreview } from '../utils/htmlRewriter';
import { resolveRelativePath } from '../utils/pathUtils';
import { AlertCircle, Lock, RefreshCw, Smartphone, Tablet, Monitor } from 'lucide-react';

interface LivePreviewFrameProps {
  project: ZipProject;
  currentHtmlFile: string;
  viewport: DeviceViewport;
  onNavigate: (newHtmlFile: string) => void;
  onConsoleLog: (msg: ConsoleLogMessage) => void;
  refreshKey: number;
}

export const LivePreviewFrame: React.FC<LivePreviewFrameProps> = ({
  project,
  currentHtmlFile,
  viewport,
  onNavigate,
  onConsoleLog,
  refreshKey,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Retrieve current HTML file
  const currentFile = project.files.get(currentHtmlFile);

  // Generate rewritten HTML content
  const previewHtml = useMemo(() => {
    if (!currentFile || !currentFile.textContent) {
      return null;
    }
    setIframeLoading(true);
    return prepareHtmlForPreview(currentFile.textContent, currentHtmlFile, project.files);
  }, [currentFile, currentHtmlFile, project, refreshKey]);

  // Handle postMessage from bridge script inside iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'WEBZIP_NAVIGATE') {
        const rawHref = event.data.href;
        if (typeof rawHref === 'string') {
          const resolvedPath = resolveRelativePath(currentHtmlFile, rawHref);
          // Check if resolved file exists in project
          if (project.files.has(resolvedPath)) {
            onNavigate(resolvedPath);
          } else {
            // Check with .html appended or without leading query
            const cleanPath = resolvedPath.split('?')[0].split('#')[0];
            if (project.files.has(cleanPath)) {
              onNavigate(cleanPath);
            } else if (project.files.has(cleanPath + '.html')) {
              onNavigate(cleanPath + '.html');
            } else {
              onConsoleLog({
                id: Math.random().toString(36).slice(2),
                level: 'warn',
                text: `Navigation target not found in ZIP: ${rawHref} (resolved to: ${resolvedPath})`,
                timestamp: new Date().toLocaleTimeString(),
              });
            }
          }
        }
      } else if (event.data.type === 'WEBZIP_CONSOLE') {
        onConsoleLog({
          id: Math.random().toString(36).slice(2),
          level: event.data.level || 'log',
          text: event.data.text || '',
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (event.data.type === 'WEBZIP_LOADED') {
        setIframeLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentHtmlFile, project, onNavigate, onConsoleLog]);

  // Calculate viewport dimensions
  const viewportStyles: Record<DeviceViewport, { width: string; height?: string; label: string }> = {
    responsive: { width: '100%', label: '100% Full Width' },
    desktop: { width: '1280px', label: 'Desktop 1280px' },
    laptop: { width: '1024px', label: 'Laptop 1024px' },
    tablet: { width: '768px', label: 'Tablet 768px' },
    mobile: { width: '375px', height: '667px', label: 'Mobile 375px' },
  };

  const selectedViewport = viewportStyles[viewport];
  const isConstrained = viewport !== 'responsive';

  if (!currentHtmlFile || !currentFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-400">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No HTML File Selected</h3>
        <p className="text-sm max-w-md text-center text-slate-400 mb-4">
          This archive doesn't have a default index.html. Select an HTML file from the top bar dropdown or switch to Code View.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col items-center justify-start overflow-auto p-2 sm:p-4">
      {/* Browser mockup window */}
      <div
        className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isConstrained ? 'my-auto' : 'w-full h-full'
        }`}
        style={{
          width: selectedViewport.width,
          maxWidth: '100%',
          height: isConstrained && selectedViewport.height ? selectedViewport.height : '100%',
          minHeight: isConstrained ? '600px' : '500px',
        }}
      >
        {/* Mock Browser Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full bg-slate-950/80 border border-slate-800/80 rounded-md px-2.5 py-1 text-[11px] text-slate-400 flex items-center gap-2 font-mono truncate">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-slate-500">https://local.preview/</span>
              <span className="text-slate-200 truncate">{currentHtmlFile}</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            {viewport === 'mobile' && <Smartphone className="w-3 h-3" />}
            {viewport === 'tablet' && <Tablet className="w-3 h-3" />}
            {(viewport === 'desktop' || viewport === 'laptop') && <Monitor className="w-3 h-3" />}
            <span>{selectedViewport.label}</span>
          </div>
        </div>

        {/* Iframe View */}
        <div className="relative flex-1 bg-white">
          {iframeLoading && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-200">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Rendering page...</span>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            srcDoc={previewHtml || ''}
            title={`Preview of ${currentHtmlFile}`}
            className="w-full h-full border-0 block"
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};
