/**
 * Utilities for normalizing and resolving file paths inside an extracted ZIP
 */

import { ExtractedFile } from '../types';

export function normalizePath(path: string): string {
  // Replace backslashes with forward slashes and strip leading slashes
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Strips query string and hash from a URL or relative path
 */
export function stripQueryAndHash(path: string): string {
  return path.split(/[?#]/)[0];
}

/**
 * Resolves a relative path against a base file path.
 * e.g. base = "views/index.html", relative = "../styles/main.css" -> "styles/main.css"
 */
export function resolveRelativePath(baseFilePath: string, relativePath: string): string {
  // If it's an absolute URL (http, https, data:, blob:, mailto:, javascript:), return as is
  if (/^(?:[a-z]+:)?\/\//i.test(relativePath) || /^(?:data|blob|mailto|javascript|#):/i.test(relativePath)) {
    return relativePath;
  }

  // Remove queries or hashes during resolution
  const [cleanPath] = relativePath.split(/(?=[?#])/);
  
  const baseNormalized = normalizePath(baseFilePath);
  const baseParts = baseNormalized.split('/');
  baseParts.pop(); // Remove the filename to get current directory

  // If path starts with '/', resolve from root
  if (cleanPath.startsWith('/')) {
    return normalizePath(cleanPath);
  }

  const relativeParts = cleanPath.split('/');
  for (const part of relativeParts) {
    if (part === '.' || part === '') {
      continue;
    } else if (part === '..') {
      if (baseParts.length > 0) {
        baseParts.pop();
      }
    } else {
      baseParts.push(part);
    }
  }

  return baseParts.join('/');
}

/**
 * Ultra-resilient asset finder: finds matching file in filesMap even if
 * paths differ by case, query strings, URL encoding, leading slashes,
 * or minor directory differences (e.g., assets/images vs images).
 */
export function findFileInProject(
  requestedPath: string,
  currentHtmlPath: string,
  filesMap: Map<string, ExtractedFile>
): ExtractedFile | undefined {
  if (!requestedPath || requestedPath.startsWith('data:') || requestedPath.startsWith('blob:') || /^(?:https?:)?\/\//i.test(requestedPath)) {
    return undefined;
  }

  // 1. Strip query and hash
  const cleanPath = stripQueryAndHash(requestedPath).trim();
  if (!cleanPath) return undefined;

  // 2. Decode URL encoding (e.g. %20 -> space)
  let decodedPath = cleanPath;
  try {
    decodedPath = decodeURIComponent(cleanPath);
  } catch {
    // keep as is if decoding error
  }

  // 3. Resolve relative to current HTML directory
  const resolvedPath = resolveRelativePath(currentHtmlPath, decodedPath);
  const cleanNormalized = normalizePath(decodedPath);

  // Candidates to test in order of precision:
  const candidateKeys = [
    resolvedPath,
    cleanNormalized,
    decodedPath,
    cleanPath,
  ];

  // Try direct exact match first
  for (const key of candidateKeys) {
    if (filesMap.has(key)) {
      return filesMap.get(key);
    }
  }

  // Case-insensitive match
  const lowerResolved = resolvedPath.toLowerCase();
  const lowerClean = cleanNormalized.toLowerCase();

  for (const [key, file] of filesMap.entries()) {
    const keyLower = key.toLowerCase();
    if (keyLower === lowerResolved || keyLower === lowerClean) {
      return file;
    }
  }

  // Suffix / Subdirectory match:
  // e.g. requested 'images/scanner.png' and file in zip is 'assets/images/scanner.png'
  // or requested '/assets/img/icon.png' and file in zip is 'img/icon.png'
  for (const [key, file] of filesMap.entries()) {
    const keyLower = key.toLowerCase();
    if (keyLower.endsWith('/' + lowerClean) || lowerClean.endsWith('/' + keyLower)) {
      return file;
    }
  }

  // Filename fallback (e.g. 'scanner.png')
  const requestedFilename = decodedPath.split('/').pop()?.toLowerCase();
  if (requestedFilename && requestedFilename.includes('.')) {
    for (const [key, file] of filesMap.entries()) {
      if (file.name.toLowerCase() === requestedFilename) {
        return file;
      }
    }
  }

  return undefined;
}

/**
 * Determine MIME type from file extension
 */
export function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    htm: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    mjs: 'application/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml; charset=utf-8',
    webp: 'image/webp',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    avif: 'image/avif',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
    txt: 'text/plain; charset=utf-8',
    md: 'text/markdown; charset=utf-8',
    xml: 'application/xml; charset=utf-8',
  };

  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Checks if a file path is considered a text file based on its extension
 */
export function isTextFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const textExtensions = new Set([
    'html', 'htm', 'css', 'js', 'mjs', 'jsx', 'ts', 'tsx',
    'json', 'svg', 'xml', 'txt', 'md', 'csv', 'yaml', 'yml',
    'scss', 'sass', 'less'
  ]);
  return textExtensions.has(ext);
}
