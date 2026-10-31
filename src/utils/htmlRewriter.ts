import { ExtractedFile } from '../types';
import { findFileInProject } from './pathUtils';

/**
 * Replaces url(...) references in CSS text with corresponding blob URLs
 */
export function rewriteCssUrls(
  cssText: string,
  cssFilePath: string,
  filesMap: Map<string, ExtractedFile>
): string {
  if (!cssText) return '';

  // 1. Matches url('...'), url("..."), url(...)
  let rewritten = cssText.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, urlValue) => {
    const trimmed = urlValue.trim();
    if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(?:https?:)?\/\//i.test(trimmed)) {
      return match;
    }

    const assetFile = findFileInProject(trimmed, cssFilePath, filesMap);
    if (assetFile?.blobUrl) {
      return `url("${assetFile.blobUrl}")`;
    }
    return match;
  });

  // 2. Matches @import '...' or @import "..."
  rewritten = rewritten.replace(/@import\s+(['"])(.*?)\1/gi, (match, quote, urlValue) => {
    const trimmed = urlValue.trim();
    if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(?:https?:)?\/\//i.test(trimmed)) {
      return match;
    }

    const assetFile = findFileInProject(trimmed, cssFilePath, filesMap);
    if (assetFile?.blobUrl) {
      return `@import "${assetFile.blobUrl}"`;
    }
    return match;
  });

  return rewritten;
}

/**
 * Helper to rewrite a srcset attribute (e.g. "img1.png 1x, img2.png 2x")
 */
function rewriteSrcset(
  srcsetVal: string,
  currentHtmlPath: string,
  filesMap: Map<string, ExtractedFile>
): string {
  return srcsetVal.split(',').map(part => {
    const trimmedPart = part.trim();
    if (!trimmedPart) return part;
    const tokens = trimmedPart.split(/\s+/);
    const url = tokens[0];
    const descriptor = tokens.slice(1).join(' ');

    const asset = findFileInProject(url, currentHtmlPath, filesMap);
    const newUrl = asset?.blobUrl || url;
    return descriptor ? `${newUrl} ${descriptor}` : newUrl;
  }).join(', ');
}

/**
 * Client bridge script injected into preview iframe to handle:
 * 1. Internal link clicks -> notify parent to change current HTML page
 * 2. Form submissions & redirects -> notify parent
 * 3. Frame buster mitigation (prevents unwanted window redirect away from app)
 * 4. Console logging & errors -> notify parent console tray
 */
const BRIDGE_SCRIPT = `
<script id="__webzip_preview_bridge__">
(function() {
  // Prevent frame-busting scripts from hijacking window.top or redirecting Chrome
  try {
    window.onbeforeunload = function() {
      // Prevent automatic unload loop
      return null;
    };
  } catch (e) {}

  // Intercept navigation helper
  function requestNavigation(rawHref) {
    if (!rawHref) return;
    if (rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) {
      return;
    }
    if (/^(?:https?:)?\\/\\//i.test(rawHref)) {
      // External link: open in separate tab safely
      window.open(rawHref, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      window.parent.postMessage({
        type: 'WEBZIP_NAVIGATE',
        href: rawHref
      }, '*');
    } catch (err) {}
  }

  // Intercept relative link navigations
  document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }
    if (/^(?:https?:)?\\/\\//i.test(href)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    requestNavigation(href);
  }, true);

  // Intercept form submissions with local target
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (!form) return;
    const action = form.getAttribute('action');
    if (action && !/^(?:https?:)?\\/\\//i.test(action)) {
      e.preventDefault();
      requestNavigation(action);
    }
  }, true);

  // Forward console messages to parent
  ['log', 'info', 'warn', 'error'].forEach(function(level) {
    const original = console[level];
    console[level] = function() {
      const args = Array.from(arguments).map(function(arg) {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg); } catch (e) { return String(arg); }
        }
        return String(arg);
      }).join(' ');
      
      try {
        window.parent.postMessage({
          type: 'WEBZIP_CONSOLE',
          level: level,
          text: args
        }, '*');
      } catch (err) {}
      if (original) original.apply(console, arguments);
    };
  });

  // Capture unhandled errors
  window.addEventListener('error', function(e) {
    try {
      window.parent.postMessage({
        type: 'WEBZIP_CONSOLE',
        level: 'error',
        text: (e.message || 'Script error') + (e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : '')
      }, '*');
    } catch (err) {}
  });

  window.addEventListener('unhandledrejection', function(e) {
    try {
      window.parent.postMessage({
        type: 'WEBZIP_CONSOLE',
        level: 'error',
        text: 'Unhandled Promise Rejection: ' + (e.reason ? (e.reason.message || String(e.reason)) : 'unknown')
      }, '*');
    } catch (err) {}
  });

  // Inform parent when DOM is ready
  window.addEventListener('DOMContentLoaded', function() {
    window.parent.postMessage({ type: 'WEBZIP_LOADED', title: document.title }, '*');
  });
})();
</script>
`;

/**
 * Transforms an HTML document by comprehensively resolving all image sources,
 * background images, stylesheets, scripts, svgs, and neutralizing unwanted redirects.
 */
export function prepareHtmlForPreview(
  htmlContent: string,
  currentHtmlPath: string,
  filesMap: Map<string, ExtractedFile>
): string {
  if (!htmlContent) return '';

  let processed = htmlContent;

  // 1. Neutralize unwanted <meta http-equiv="refresh"> redirects if they point to external or missing urls
  processed = processed.replace(/<meta\s+[^>]*?http-equiv=["']refresh["'][^>]*?>/gi, (match) => {
    const contentMatch = match.match(/content=["'](.*?)["']/i);
    if (!contentMatch) return '';
    const contentVal = contentMatch[1];
    const urlMatch = contentVal.match(/url=(.*)/i);
    if (urlMatch) {
      const target = urlMatch[1].trim();
      const asset = findFileInProject(target, currentHtmlPath, filesMap);
      if (asset) {
        // Safe internal redirect
        return `<script>setTimeout(function(){ window.parent.postMessage({type:'WEBZIP_NAVIGATE', href:'${asset.path}'}, '*'); }, 100);</script>`;
      }
    }
    // Neutralize to prevent Chrome redirect loop
    return '<!-- Neutralized meta refresh -->';
  });

  // 2. Process <link rel="stylesheet"> and icon links
  processed = processed.replace(/<link\s+([^>]*?)>/gi, (match, attrs) => {
    const isStylesheet = /rel=["'](?:preload\s+)?stylesheet["']/i.test(attrs);
    const hrefMatch = attrs.match(/href=["'](.*?)["']/i);
    if (!hrefMatch) return match;

    const rawHref = hrefMatch[1].trim();
    if (rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('//') || rawHref.startsWith('data:') || rawHref.startsWith('blob:')) {
      return match;
    }

    const assetFile = findFileInProject(rawHref, currentHtmlPath, filesMap);

    if (isStylesheet) {
      if (assetFile && assetFile.textContent) {
        // Inline the CSS with resolved internal URLs
        const rewrittenCss = rewriteCssUrls(assetFile.textContent, assetFile.path, filesMap);
        return `<style data-original-href="${rawHref}">\n/* Inlined: ${assetFile.path} */\n${rewrittenCss}\n</style>`;
      } else if (assetFile?.blobUrl) {
        return match.replace(hrefMatch[0], `href="${assetFile.blobUrl}"`);
      }
    } else {
      // Icons, preloads, fonts
      if (assetFile?.blobUrl) {
        return match.replace(hrefMatch[0], `href="${assetFile.blobUrl}"`);
      }
    }

    return match;
  });

  // 3. Process <style>...</style> blocks inside HTML
  processed = processed.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, content) => {
    const rewritten = rewriteCssUrls(content, currentHtmlPath, filesMap);
    return `<style${attrs}>${rewritten}</style>`;
  });

  // 4. Process inline style="..." attributes on ALL elements (e.g. style="background-image: url(...)")
  processed = processed.replace(/\bstyle=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    if (!styleContent.includes('url(')) return match;
    const rewritten = rewriteCssUrls(styleContent, currentHtmlPath, filesMap);
    return `style=${quote}${rewritten}${quote}`;
  });

  // 5. Process <script src="...">
  processed = processed.replace(/<script\s+([^>]*?)>/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src=["'](.*?)["']/i);
    if (!srcMatch) return match;
    const rawSrc = srcMatch[1].trim();

    if (rawSrc.startsWith('http://') || rawSrc.startsWith('https://') || rawSrc.startsWith('//') || rawSrc.startsWith('data:') || rawSrc.startsWith('blob:')) {
      return match;
    }

    const scriptFile = findFileInProject(rawSrc, currentHtmlPath, filesMap);
    if (scriptFile?.blobUrl) {
      return match.replace(srcMatch[0], `src="${scriptFile.blobUrl}"`);
    }

    return match;
  });

  // 6. Process image & media attributes on all tags:
  // src, srcset, data-src, data-lazy-src, data-original, poster, background
  const targetTags = ['img', 'video', 'audio', 'source', 'iframe', 'embed', 'image', 'use', 'body', 'td', 'div', 'section'];
  for (const tag of targetTags) {
    const regex = new RegExp(`<${tag}\\b([^>]*?)>`, 'gi');
    processed = processed.replace(regex, (match, attrs) => {
      let updatedAttrs = attrs;

      // a. Handle src
      updatedAttrs = updatedAttrs.replace(/\bsrc=["'](.*?)["']/i, (srcMatch: string, rawSrc: string) => {
        const trimmed = rawSrc.trim();
        if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(?:https?:)?\/\//i.test(trimmed)) {
          return srcMatch;
        }
        const asset = findFileInProject(trimmed, currentHtmlPath, filesMap);
        return asset?.blobUrl ? `src="${asset.blobUrl}"` : srcMatch;
      });

      // b. Handle href / xlink:href (for SVG <image> and <use>)
      updatedAttrs = updatedAttrs.replace(/\b(?:xlink:)?href=["'](.*?)["']/i, (hrefMatch: string, rawHref: string) => {
        const trimmed = rawHref.trim();
        if (trimmed.startsWith('#') || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(?:https?:)?\/\//i.test(trimmed)) {
          return hrefMatch;
        }
        const asset = findFileInProject(trimmed, currentHtmlPath, filesMap);
        return asset?.blobUrl ? `href="${asset.blobUrl}"` : hrefMatch;
      });

      // c. Handle srcset
      updatedAttrs = updatedAttrs.replace(/\bsrcset=["'](.*?)["']/i, (srcsetMatch: string, rawSrcset: string) => {
        const rewritten = rewriteSrcset(rawSrcset, currentHtmlPath, filesMap);
        return `srcset="${rewritten}"`;
      });

      // d. Handle lazy loading attributes (data-src, data-lazy-src, data-original)
      const lazyAttrs = ['data-src', 'data-lazy-src', 'data-original', 'data-srcset'];
      for (const attr of lazyAttrs) {
        const attrRegex = new RegExp(`\\b${attr}=["'](.*?)["']`, 'i');
        updatedAttrs = updatedAttrs.replace(attrRegex, (lazyMatch: string, rawVal: string) => {
          const trimmed = rawVal.trim();
          if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(?:https?:)?\/\//i.test(trimmed)) {
            return lazyMatch;
          }
          if (attr === 'data-srcset') {
            const rewritten = rewriteSrcset(trimmed, currentHtmlPath, filesMap);
            return `${attr}="${rewritten}"`;
          }
          const asset = findFileInProject(trimmed, currentHtmlPath, filesMap);
          return asset?.blobUrl ? `${attr}="${asset.blobUrl}"` : lazyMatch;
        });
      }

      // e. Handle poster (for video)
      updatedAttrs = updatedAttrs.replace(/\bposter=["'](.*?)["']/i, (posterMatch: string, rawPoster: string) => {
        const trimmed = rawPoster.trim();
        if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(?:https?:)?\/\//i.test(trimmed)) {
          return posterMatch;
        }
        const asset = findFileInProject(trimmed, currentHtmlPath, filesMap);
        return asset?.blobUrl ? `poster="${asset.blobUrl}"` : posterMatch;
      });

      // f. Handle background attribute (older HTML templates)
      updatedAttrs = updatedAttrs.replace(/\bbackground=["'](.*?)["']/i, (bgMatch: string, rawBg: string) => {
        const trimmed = rawBg.trim();
        if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^(?:https?:)?\/\//i.test(trimmed)) {
          return bgMatch;
        }
        const asset = findFileInProject(trimmed, currentHtmlPath, filesMap);
        return asset?.blobUrl ? `background="${asset.blobUrl}"` : bgMatch;
      });

      return `<${tag}${updatedAttrs}>`;
    });
  }

  // 7. Inject our client bridge script
  if (processed.includes('</body>')) {
    processed = processed.replace('</body>', `${BRIDGE_SCRIPT}</body>`);
  } else if (processed.includes('</html>')) {
    processed = processed.replace('</html>', `${BRIDGE_SCRIPT}</html>`);
  } else {
    processed += BRIDGE_SCRIPT;
  }

  return processed;
}
