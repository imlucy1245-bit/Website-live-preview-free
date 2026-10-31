import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileCode,
  Folder,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  Eye,
  Search,
  ChevronRight,
  ChevronDown,
  Music,
  File,
  Code2
} from 'lucide-react';
import { ExtractedFile, ZipProject } from '../types';

interface CodeInspectorProps {
  project: ZipProject;
  onOpenInPreview: (htmlFile: string) => void;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({
  project,
  onOpenInPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    project.entryHtmlFile || Array.from(project.files.keys())[0] || ''
  );
  const [copied, setCopied] = useState(false);

  const selectedFile = project.files.get(selectedFilePath);

  // Group files into a virtual tree structure
  const fileList = useMemo(() => {
    const list = Array.from(project.files.values());
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(f => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
  }, [project, searchQuery]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: ExtractedFile) => {
    const ext = file.extension;
    if (['html', 'htm'].includes(ext)) return <FileCode className="w-4 h-4 text-orange-400" />;
    if (['css', 'scss', 'less'].includes(ext)) return <FileCode className="w-4 h-4 text-cyan-400" />;
    if (['js', 'mjs', 'jsx', 'ts', 'tsx'].includes(ext)) return <FileCode className="w-4 h-4 text-yellow-400" />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music className="w-4 h-4 text-purple-400" />;
    if (['json', 'xml', 'yaml', 'yml'].includes(ext)) return <FileText className="w-4 h-4 text-indigo-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const handleCopy = () => {
    if (selectedFile?.textContent) {
      navigator.clipboard.writeText(selectedFile.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const link = document.createElement('a');
    if (selectedFile.blobUrl) {
      link.href = selectedFile.blobUrl;
    } else if (selectedFile.textContent) {
      const blob = new Blob([selectedFile.textContent], { type: selectedFile.mimeType });
      link.href = URL.createObjectURL(blob);
    } else {
      return;
    }
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* File Explorer Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{fileList.length} files listed</span>
            <span className="font-mono">{formatBytes(project.uncompressedSize)} total</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {fileList.map((file) => {
            const isSelected = file.path === selectedFilePath;
            const isHtml = file.extension === 'html' || file.extension === 'htm';

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(file)}
                  <span className="truncate">{file.path}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isHtml && (
                    <span className="px-1 py-0.2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-[9px] font-mono">
                      HTML
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatBytes(file.size)}
                  </span>
                </div>
              </button>
            );
          })}

          {fileList.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500">
              No files match "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Code / Content Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {selectedFile ? (
          <>
            {/* Viewer Header */}
            <div className="h-11 border-b border-slate-800 bg-slate-900/40 px-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(selectedFile)}
                <span className="text-xs font-semibold text-white truncate font-mono">
                  {selectedFile.path}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({formatBytes(selectedFile.size)})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(selectedFile.extension === 'html' || selectedFile.extension === 'htm') && (
                  <button
                    type="button"
                    onClick={() => onOpenInPreview(selectedFile.path)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                )}

                {selectedFile.textContent && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Copy contents"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  title="Download this file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 overflow-auto p-4">
              {selectedFile.textContent !== undefined ? (
                <div className="relative font-mono text-xs leading-relaxed text-slate-300 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 overflow-x-auto">
                  <pre className="tab-4">
                    <code>{selectedFile.textContent}</code>
                  </pre>
                </div>
              ) : selectedFile.mimeType.startsWith('image/') && selectedFile.blobUrl ? (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900/20 rounded-xl border border-slate-800/60">
                  <img
                    src={selectedFile.blobUrl}
                    alt={selectedFile.name}
                    className="max-h-[400px] max-w-full rounded-lg object-contain shadow-lg border border-slate-800"
                  />
                  <div className="mt-4 text-xs text-slate-400 font-mono">
                    {selectedFile.name} • {formatBytes(selectedFile.size)} • {selectedFile.mimeType}
                  </div>
                </div>
              ) : selectedFile.mimeType.startsWith('audio/') && selectedFile.blobUrl ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                    <Music className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2">{selectedFile.name}</h4>
                  <audio controls src={selectedFile.blobUrl} className="mt-2" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400">
                  <File className="w-12 h-12 text-slate-600 mb-3" />
                  <div className="text-sm font-medium text-slate-300">{selectedFile.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Binary asset ({formatBytes(selectedFile.size)})</div>
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Select a file from the explorer on the left to view code
          </div>
        )}
      </div>
    </div>
  );
};
