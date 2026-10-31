import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteCssUrls, prepareHtmlForPreview } from './htmlRewriter';
import { ExtractedFile } from '../types';

test('rewriteCssUrls rewrites relative background images to blob urls', () => {
  const filesMap = new Map<string, ExtractedFile>();
  filesMap.set('images/hero.png', {
    path: 'images/hero.png',
    name: 'hero.png',
    extension: 'png',
    size: 1024,
    isBinary: true,
    mimeType: 'image/png',
    blobUrl: 'blob:http://localhost:3000/mock-hero-uuid'
  });

  const rawCss = `.hero { background-image: url('../images/hero.png?v=2'); }`;
  const transformed = rewriteCssUrls(rawCss, 'css/style.css', filesMap);

  assert.match(transformed, /blob:http:\/\/localhost:3000\/mock-hero-uuid/);
});

test('prepareHtmlForPreview inlines css, rewrites images, inline styles, and neutralizes unwanted redirects', () => {
  const filesMap = new Map<string, ExtractedFile>();
  filesMap.set('style.css', {
    path: 'style.css',
    name: 'style.css',
    extension: 'css',
    size: 50,
    isBinary: false,
    mimeType: 'text/css',
    textContent: 'body { color: red; }',
    blobUrl: 'blob:css-uuid'
  });
  filesMap.set('scanner-icon.png', {
    path: 'scanner-icon.png',
    name: 'scanner-icon.png',
    extension: 'png',
    size: 200,
    isBinary: true,
    mimeType: 'image/png',
    blobUrl: 'blob:scanner-icon-uuid'
  });
  filesMap.set('bg.jpg', {
    path: 'bg.jpg',
    name: 'bg.jpg',
    extension: 'jpg',
    size: 300,
    isBinary: true,
    mimeType: 'image/jpeg',
    blobUrl: 'blob:bg-uuid'
  });

  const rawHtml = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="5; url=https://malicious-external-redirect.com">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Scanner App</h1>
  <img src="scanner-icon.png?v=1" alt="Scanner Icon">
  <div style="background-image: url('bg.jpg')">Hero Section</div>
</body>
</html>`;

  const result = prepareHtmlForPreview(rawHtml, 'index.html', filesMap);

  // Checks
  assert.ok(result.includes('body { color: red; }'), 'Should inline resolved CSS');
  assert.ok(result.includes('src="blob:scanner-icon-uuid"'), 'Should replace img src with blob url');
  assert.ok(result.includes('blob:bg-uuid'), 'Should replace inline style url with blob url');
  assert.ok(!result.includes('malicious-external-redirect.com'), 'Should neutralize external meta refresh');
  assert.ok(result.includes('__webzip_preview_bridge__'), 'Should inject bridge script');
});
