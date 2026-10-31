import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath, resolveRelativePath, getMimeType, isTextFile, findFileInProject, stripQueryAndHash } from './pathUtils';
import { ExtractedFile } from '../types';

test('normalizePath cleans leading slashes and windows backslashes', () => {
  assert.equal(normalizePath('\\public\\index.html'), 'public/index.html');
  assert.equal(normalizePath('/src/app.js'), 'src/app.js');
  assert.equal(normalizePath('folder//subfolder/file.css'), 'folder//subfolder/file.css');
});

test('stripQueryAndHash removes query params and hashes', () => {
  assert.equal(stripQueryAndHash('images/scanner.png?v=2&cache=0'), 'images/scanner.png');
  assert.equal(stripQueryAndHash('style.css#main'), 'style.css');
});

test('resolveRelativePath handles adjacent and parent navigation correctly', () => {
  assert.equal(resolveRelativePath('index.html', 'style.css'), 'style.css');
  assert.equal(resolveRelativePath('views/index.html', '../css/style.css'), 'css/style.css');
  assert.equal(resolveRelativePath('pages/sub/page.html', '../../images/logo.png'), 'images/logo.png');
  assert.equal(resolveRelativePath('index.html', './js/main.js'), 'js/main.js');
  assert.equal(resolveRelativePath('pages/index.html', '/assets/app.js'), 'assets/app.js');
});

test('findFileInProject matches files despite case mismatch, query params, and folder differences', () => {
  const filesMap = new Map<string, ExtractedFile>();
  const mockFile: ExtractedFile = {
    path: 'assets/images/scanner-device.png',
    name: 'scanner-device.png',
    extension: 'png',
    size: 2048,
    isBinary: true,
    mimeType: 'image/png',
    blobUrl: 'blob:scanner-device-url'
  };
  filesMap.set(mockFile.path, mockFile);

  // Exact match
  assert.equal(findFileInProject('assets/images/scanner-device.png', 'index.html', filesMap)?.blobUrl, 'blob:scanner-device-url');

  // Match with query string
  assert.equal(findFileInProject('assets/images/scanner-device.png?v=1.2.3', 'index.html', filesMap)?.blobUrl, 'blob:scanner-device-url');

  // Match with case differences (uppercase)
  assert.equal(findFileInProject('ASSETS/IMAGES/SCANNER-DEVICE.PNG', 'index.html', filesMap)?.blobUrl, 'blob:scanner-device-url');

  // Match relative from subfolder
  assert.equal(findFileInProject('../assets/images/scanner-device.png', 'pages/scan.html', filesMap)?.blobUrl, 'blob:scanner-device-url');

  // Fallback match by filename
  assert.equal(findFileInProject('images/scanner-device.png', 'index.html', filesMap)?.blobUrl, 'blob:scanner-device-url');
  assert.equal(findFileInProject('./scanner-device.png', 'index.html', filesMap)?.blobUrl, 'blob:scanner-device-url');
});

test('getMimeType and isTextFile identify web formats correctly', () => {
  assert.equal(getMimeType('index.html'), 'text/html; charset=utf-8');
  assert.equal(getMimeType('style.css'), 'text/css; charset=utf-8');
  assert.equal(getMimeType('scanner.png'), 'image/png');
  assert.equal(getMimeType('photo.jpg'), 'image/jpeg');
  assert.equal(getMimeType('graphic.avif'), 'image/avif');

  assert.equal(isTextFile('main.js'), true);
  assert.equal(isTextFile('styles.css'), true);
  assert.equal(isTextFile('hero.png'), false);
});
