import JSZip from 'jszip';
import { ExtractedFile, ZipProject } from '../types';
import { getMimeType, isTextFile, normalizePath } from './pathUtils';

/**
 * Finds if all files share a common root directory wrapper, and returns it.
 * e.g., if files are ["site/index.html", "site/css/style.css"], returns "site/"
 */
export function detectCommonRootDir(filePaths: string[]): string {
  if (filePaths.length === 0) return '';
  
  // Exclude OS metadata files like __MACOSX/
  const validPaths = filePaths.filter(p => !p.startsWith('__MACOSX/'));
  if (validPaths.length === 0) return '';

  const firstPath = validPaths[0];
  const firstSlashIndex = firstPath.indexOf('/');
  if (firstSlashIndex === -1) return ''; // Root has direct files

  const candidate = firstPath.slice(0, firstSlashIndex + 1);
  const allShareCandidate = validPaths.every(p => p.startsWith(candidate));

  return allShareCandidate ? candidate : '';
}

/**
 * Prioritizes entry HTML file from list of HTML files.
 */
export function pickEntryHtmlFile(htmlFiles: string[]): string {
  if (htmlFiles.length === 0) return '';

  const priorities = [
    /^index\.html?$/i,
    /\/index\.html?$/i,
    /^scanner\.html?$/i,
    /\/scanner\.html?$/i,
    /^home\.html?$/i,
    /\/home\.html?$/i,
    /^main\.html?$/i,
    /\/main\.html?$/i,
    /^default\.html?$/i,
    /\/default\.html?$/i,
    /^app\.html?$/i,
  ];

  for (const regex of priorities) {
    const match = htmlFiles.find(f => regex.test(f));
    if (match) return match;
  }

  // If none match specific names, return the one with shortest depth, then shortest length
  return [...htmlFiles].sort((a, b) => {
    const depthA = a.split('/').length;
    const depthB = b.split('/').length;
    if (depthA !== depthB) return depthA - depthB;
    return a.length - b.length;
  })[0];
}

/**
 * Parses a ZIP file buffer or blob and returns a fully organized ZipProject
 */
export async function parseZipArchive(
  data: ArrayBuffer | Uint8Array | Blob | File,
  originalFileName: string = 'website.zip'
): Promise<ZipProject> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(data);

  const rawEntries: { path: string; entry: JSZip.JSZipObject }[] = [];
  loadedZip.forEach((relativePath, entry) => {
    if (!entry.dir && !relativePath.startsWith('__MACOSX/')) {
      rawEntries.push({ path: normalizePath(relativePath), entry });
    }
  });

  if (rawEntries.length === 0) {
    throw new Error('The uploaded ZIP archive contains no readable files.');
  }

  const rawPaths = rawEntries.map(e => e.path);
  const commonPrefix = detectCommonRootDir(rawPaths);

  const filesMap = new Map<string, ExtractedFile>();
  const htmlFiles: string[] = [];
  let uncompressedSize = 0;

  for (const { path: rawPath, entry } of rawEntries) {
    // Strip common directory prefix if present
    const normalizedRelativePath = commonPrefix && rawPath.startsWith(commonPrefix)
      ? rawPath.slice(commonPrefix.length)
      : rawPath;

    if (!normalizedRelativePath) continue;

    const parts = normalizedRelativePath.split('/');
    const name = parts[parts.length - 1];
    const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : '';
    const mimeType = getMimeType(normalizedRelativePath);
    const isText = isTextFile(normalizedRelativePath);

    let textContent: string | undefined;
    let binaryContent: Uint8Array | undefined;
    let blobUrl: string | undefined;

    if (isText) {
      textContent = await entry.async('string');
      const blob = new Blob([textContent], { type: mimeType });
      blobUrl = URL.createObjectURL(blob);
      uncompressedSize += textContent.length;
    } else {
      // Use arraybuffer for pristine binary asset (image, font, audio) decoding
      const arrayBuffer = await entry.async('arraybuffer');
      const blob = new Blob([arrayBuffer], { type: mimeType });
      blobUrl = URL.createObjectURL(blob);
      binaryContent = new Uint8Array(arrayBuffer);
      uncompressedSize += arrayBuffer.byteLength;
    }

    const extracted: ExtractedFile = {
      path: normalizedRelativePath,
      name,
      extension,
      size: (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || (textContent?.length ?? binaryContent?.byteLength ?? 0),
      isBinary: !isText,
      mimeType,
      textContent,
      binaryContent,
      blobUrl,
    };

    filesMap.set(normalizedRelativePath, extracted);

    if (extension === 'html' || extension === 'htm') {
      htmlFiles.push(normalizedRelativePath);
    }
  }

  const entryHtmlFile = pickEntryHtmlFile(htmlFiles);

  const totalZipSize = data instanceof Blob || data instanceof File ? data.size : (data as ArrayBuffer).byteLength;

  return {
    fileName: originalFileName,
    totalZipSize,
    uncompressedSize,
    fileCount: filesMap.size,
    files: filesMap,
    rootDir: commonPrefix,
    htmlFiles: htmlFiles.sort(),
    entryHtmlFile,
    uploadedAt: new Date(),
  };
}

/**
 * Cleans up generated blob URLs when a project is replaced/unloaded
 */
export function cleanupProjectBlobs(project?: ZipProject | null) {
  if (!project) return;
  for (const file of project.files.values()) {
    if (file.blobUrl) {
      try {
        URL.revokeObjectURL(file.blobUrl);
      } catch {
        // ignore revoke error
      }
    }
  }
}
