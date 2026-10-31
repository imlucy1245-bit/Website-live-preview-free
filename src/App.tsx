/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, DeviceViewport, ZipProject, ConsoleLogMessage } from './types';
import { parseZipArchive, cleanupProjectBlobs } from './utils/zipParser';
import { createSaasDemoZip, createArcadeGameZip, createScannerDemoZip } from './utils/demoWebsites';
import { Navbar } from './components/Navbar';
import { UploadDropzone } from './components/UploadDropzone';
import { PreviewToolbar } from './components/PreviewToolbar';
import { LivePreviewFrame } from './components/LivePreviewFrame';
import { CodeInspector } from './components/CodeInspector';
import { ConsoleDrawer } from './components/ConsoleDrawer';
import { prepareHtmlForPreview } from './utils/htmlRewriter';

export default function App() {
  const [project, setProject] = useState<ZipProject | null>(null);
  const [currentHtmlFile, setCurrentHtmlFile] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [viewport, setViewport] = useState<DeviceViewport>('responsive');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogMessage[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-start or URL parameter support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('demo') === 'scanner') {
      handleLoadScannerDemo();
    } else if (params.get('demo') === 'saas') {
      handleLoadSaasDemo();
    } else if (params.get('demo') === 'game') {
      handleLoadGameDemo();
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage(`Extracting & resolving ${file.name}...`);
    try {
      if (project) {
        cleanupProjectBlobs(project);
      }
      setConsoleLogs([]);
      const parsed = await parseZipArchive(file, file.name);
      setProject(parsed);
      setCurrentHtmlFile(parsed.entryHtmlFile || parsed.htmlFiles[0] || '');
      setActiveTab('preview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse ZIP archive.';
      alert(msg);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleLoadScannerDemo = async () => {
    setIsLoading(true);
    setLoadingMessage('Loading QR & Barcode Scanner with image assets...');
    try {
      if (project) {
        cleanupProjectBlobs(project);
      }
      setConsoleLogs([]);
      const demo = await createScannerDemoZip();
      setProject(demo);
      setCurrentHtmlFile(demo.entryHtmlFile);
      setActiveTab('preview');
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleLoadSaasDemo = async () => {
    setIsLoading(true);
    setLoadingMessage('Loading SaaS multi-page template demo...');
    try {
      if (project) {
        cleanupProjectBlobs(project);
      }
      setConsoleLogs([]);
      const demo = await createSaasDemoZip();
      setProject(demo);
      setCurrentHtmlFile(demo.entryHtmlFile);
      setActiveTab('preview');
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleLoadGameDemo = async () => {
    setIsLoading(true);
    setLoadingMessage('Loading Neon Dodger arcade game demo...');
    try {
      if (project) {
        cleanupProjectBlobs(project);
      }
      setConsoleLogs([]);
      const demo = await createArcadeGameZip();
      setProject(demo);
      setCurrentHtmlFile(demo.entryHtmlFile);
      setActiveTab('preview');
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    if (project) {
      cleanupProjectBlobs(project);
    }
    setProject(null);
    setCurrentHtmlFile('');
    setConsoleLogs([]);
    setIsConsoleOpen(false);
    setIsFullscreen(false);
  };

  const handleNavigate = useCallback((newHtmlFile: string) => {
    setCurrentHtmlFile(newHtmlFile);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleConsoleLog = useCallback((msg: ConsoleLogMessage) => {
    setConsoleLogs((prev) => [...prev.slice(-150), msg]);
  }, []);

  const handleOpenNewTab = () => {
    if (!project || !currentHtmlFile) return;
    const file = project.files.get(currentHtmlFile);
    if (!file || !file.textContent) return;

    const preparedHtml = prepareHtmlForPreview(file.textContent, currentHtmlFile, project.files);
    const blob = new Blob([preparedHtml], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const hasErrors = consoleLogs.some((l) => l.level === 'error');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
        consoleCount={consoleLogs.length}
        hasErrors={hasErrors}
        onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
        isConsoleOpen={isConsoleOpen}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!project ? (
          <UploadDropzone
            onFileSelect={handleFileUpload}
            onLoadScannerDemo={handleLoadScannerDemo}
            onLoadSaasDemo={handleLoadSaasDemo}
            onLoadGameDemo={handleLoadGameDemo}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
          />
        ) : (
          <div className={`flex-1 flex flex-col overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : ''}`}>
            {/* Toolbar if preview is visible */}
            {(activeTab === 'preview' || activeTab === 'split' || isFullscreen) && (
              <PreviewToolbar
                htmlFiles={project.htmlFiles}
                currentHtmlFile={currentHtmlFile}
                onSelectHtmlFile={setCurrentHtmlFile}
                viewport={viewport}
                onSelectViewport={setViewport}
                onRefresh={() => setRefreshKey((k) => k + 1)}
                onOpenNewTab={handleOpenNewTab}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
              />
            )}

            {/* Content Body */}
            <div className="flex-1 flex overflow-hidden">
              {(activeTab === 'preview' || isFullscreen) && (
                <LivePreviewFrame
                  project={project}
                  currentHtmlFile={currentHtmlFile}
                  viewport={viewport}
                  onNavigate={handleNavigate}
                  onConsoleLog={handleConsoleLog}
                  refreshKey={refreshKey}
                />
              )}

              {!isFullscreen && activeTab === 'code' && (
                <CodeInspector
                  project={project}
                  onOpenInPreview={(htmlFile) => {
                    setCurrentHtmlFile(htmlFile);
                    setActiveTab('preview');
                  }}
                />
              )}

              {!isFullscreen && activeTab === 'split' && (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <LivePreviewFrame
                      project={project}
                      currentHtmlFile={currentHtmlFile}
                      viewport={viewport}
                      onNavigate={handleNavigate}
                      onConsoleLog={handleConsoleLog}
                      refreshKey={refreshKey}
                    />
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <CodeInspector
                      project={project}
                      onOpenInPreview={(htmlFile) => {
                        setCurrentHtmlFile(htmlFile);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Console Drawer */}
            {isConsoleOpen && !isFullscreen && (
              <ConsoleDrawer
                logs={consoleLogs}
                onClear={() => setConsoleLogs([])}
                onClose={() => setIsConsoleOpen(false)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
