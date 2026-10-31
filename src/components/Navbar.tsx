import React from 'react';
import { FileArchive, RotateCcw, Eye, Code2, Columns2, Terminal, ExternalLink } from 'lucide-react';
import { ActiveTab, ZipProject } from '../types';

interface NavbarProps {
  project: ZipProject | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onReset: () => void;
  consoleCount: number;
  hasErrors: boolean;
  onToggleConsole: () => void;
  isConsoleOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  activeTab,
  onTabChange,
  onReset,
  consoleCount,
  hasErrors,
  onToggleConsole,
  isConsoleOpen,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Active project info */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2.5 text-left group"
          title="Return to home / upload"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <FileArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                WebZip<span className="text-indigo-400">Live</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PREVIEWER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Instant In-Browser Website Preview</p>
          </div>
        </button>

        {project && (
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="font-medium text-white truncate max-w-[180px]">{project.fileName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{project.fileCount} files</span>
              <span className="text-slate-500">•</span>
              <span className="text-indigo-400 font-mono">{formatBytes(project.uncompressedSize)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Center Tabs when project loaded */}
      {project && (
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onTabChange('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code & Files</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {project && (
          <>
            <button
              type="button"
              onClick={onToggleConsole}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isConsoleOpen
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : hasErrors
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle website console output"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Console</span>
              {consoleCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  hasErrors ? 'bg-red-500/30 text-red-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {consoleCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Upload another ZIP file"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload New ZIP</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
