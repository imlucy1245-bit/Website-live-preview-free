import React, { useState } from 'react';
import { Terminal, Trash2, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { ConsoleLogMessage } from '../types';

interface ConsoleDrawerProps {
  logs: ConsoleLogMessage[];
  onClear: () => void;
  onClose: () => void;
}

export const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({
  logs,
  onClear,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'log'>('all');

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'error') return l.level === 'error';
    if (filter === 'warn') return l.level === 'warn';
    return l.level === 'log' || l.level === 'info';
  });

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  return (
    <div className="h-56 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 z-30 font-mono text-xs">
      {/* Console Header */}
      <div className="h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Website Console</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded ${
                filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                filter === 'error' ? 'bg-red-500/20 text-red-300 font-medium' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <span>Errors</span>
              {errorCount > 0 && <span className="text-[10px] bg-red-500/30 px-1 rounded">{errorCount}</span>}
            </button>
            <button
              type="button"
              onClick={() => setFilter('warn')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                filter === 'warn' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span>Warnings</span>
              {warnCount > 0 && <span className="text-[10px] bg-amber-500/30 px-1 rounded">{warnCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Close console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Messages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredLogs.map((log) => {
          let levelIcon = <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
          let levelClasses = 'text-slate-300';
          let bgClass = 'hover:bg-slate-900/60';

          if (log.level === 'error') {
            levelIcon = <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
            levelClasses = 'text-red-300';
            bgClass = 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-red-500';
          } else if (log.level === 'warn') {
            levelIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
            levelClasses = 'text-amber-300';
            bgClass = 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-500';
          }

          return (
            <div
              key={log.id}
              className={`flex items-start gap-2 px-2 py-1 rounded text-xs leading-relaxed ${levelClasses} ${bgClass}`}
            >
              <span className="text-[10px] text-slate-500 shrink-0 pt-0.5">{log.timestamp}</span>
              {levelIcon}
              <span className="break-all whitespace-pre-wrap">{log.text}</span>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs">
            No console output recorded yet
          </div>
        )}
      </div>
    </div>
  );
};
