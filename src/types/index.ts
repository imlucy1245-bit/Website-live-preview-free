export interface ExtractedFile {
  path: string; // e.g. "index.html" or "assets/style.css"
  name: string; // e.g. "style.css"
  extension: string; // e.g. "css"
  size: number; // in bytes
  isBinary: boolean;
  mimeType: string;
  textContent?: string;
  binaryContent?: Uint8Array;
  blobUrl?: string;
}

export interface ZipProject {
  fileName: string;
  totalZipSize: number;
  uncompressedSize: number;
  fileCount: number;
  files: Map<string, ExtractedFile>;
  rootDir: string;
  htmlFiles: string[];
  entryHtmlFile: string;
  uploadedAt: Date;
}

export type DeviceViewport = 'responsive' | 'desktop' | 'laptop' | 'tablet' | 'mobile';

export interface ViewportConfig {
  id: DeviceViewport;
  name: string;
  width: string;
  height: string;
  icon: string;
}

export type ActiveTab = 'preview' | 'code' | 'split' | 'info';

export interface ConsoleLogMessage {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: string;
}
