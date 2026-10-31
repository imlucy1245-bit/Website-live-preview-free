import JSZip from 'jszip';
import { parseZipArchive } from './zipParser';
import { ZipProject } from '../types';

/**
 * Creates an interactive QR & Document Scanner website ZIP project
 * with real embedded images (SVG, PNG data), CSS backgrounds, and multi-page routing.
 */
export async function createScannerDemoZip(): Promise<ZipProject> {
  const zip = new JSZip();

  // SVG scanner camera graphic
  const scannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="30" fill="#0f172a"/>
    <path d="M 40 70 L 40 40 L 70 40" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M 130 40 L 160 40 L 160 70" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M 160 130 L 160 160 L 130 160" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M 70 160 L 40 160 L 40 130" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" fill="none"/>
    <rect x="65" y="65" width="70" height="70" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
    <line x1="45" y1="100" x2="155" y2="100" stroke="#ef4444" stroke-width="3" stroke-dasharray="4,4"/>
  </svg>`;

  // QR Code sample image
  const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <rect width="160" height="160" rx="16" fill="#ffffff"/>
    <!-- Position Markers -->
    <rect x="15" y="15" width="40" height="40" rx="6" fill="#0f172a"/>
    <rect x="23" y="23" width="24" height="24" rx="3" fill="#ffffff"/>
    <rect x="28" y="28" width="14" height="14" rx="2" fill="#0f172a"/>

    <rect x="105" y="15" width="40" height="40" rx="6" fill="#0f172a"/>
    <rect x="113" y="23" width="24" height="24" rx="3" fill="#ffffff"/>
    <rect x="118" y="28" width="14" height="14" rx="2" fill="#0f172a"/>

    <rect x="15" y="105" width="40" height="40" rx="6" fill="#0f172a"/>
    <rect x="23" y="113" width="24" height="24" rx="3" fill="#ffffff"/>
    <rect x="28" y="118" width="14" height="14" rx="2" fill="#0f172a"/>

    <!-- Data matrix bits -->
    <rect x="70" y="20" width="12" height="12" fill="#0f172a"/>
    <rect x="85" y="35" width="10" height="10" fill="#0f172a"/>
    <rect x="70" y="65" width="20" height="20" fill="#0f172a"/>
    <rect x="110" y="70" width="12" height="12" fill="#0f172a"/>
    <rect x="130" y="85" width="12" height="12" fill="#0f172a"/>
    <rect x="25" y="75" width="12" height="12" fill="#0f172a"/>
    <rect x="75" y="105" width="15" height="15" fill="#0f172a"/>
    <rect x="105" y="115" width="20" height="20" fill="#0f172a"/>
    <rect x="135" y="125" width="12" height="12" fill="#0f172a"/>
  </svg>`;

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniScan - High-Speed Web Scanner</title>
  <link rel="stylesheet" href="css/scanner.css">
</head>
<body>
  <div class="app-layout">
    <header class="app-header">
      <div class="brand">
        <img src="images/scanner-icon.svg" alt="Scanner Logo" class="brand-icon">
        <span class="brand-name">OmniScan <strong>PRO</strong></span>
      </div>
      <nav class="top-nav">
        <a href="index.html" class="nav-btn active">Live View</a>
        <a href="gallery.html" class="nav-btn">Saved Scans</a>
        <a href="settings.html" class="nav-btn">Config</a>
      </nav>
    </header>

    <main class="scanner-main">
      <div class="viewfinder-card" style="background-image: url('images/grid-bg.svg');">
        <div class="scanner-frame">
          <div class="laser-beam"></div>
          <div class="qr-target-preview">
            <img src="images/sample-qr.svg" alt="Target QR Code" id="targetImg">
          </div>
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
        </div>

        <div class="scanner-controls">
          <button id="scanBtn" class="btn-action">⚡ TRIGGER SCAN</button>
          <div id="scanResult" class="scan-result" style="display: none;">
            <div class="result-badge">DECODED PAYLOAD:</div>
            <p id="resultText">https://example.com/product/scanner-item-994</p>
          </div>
        </div>
      </div>

      <div class="recent-scans-tray">
        <h3>Sample Documents to Scan</h3>
        <p class="hint">Images resolved directly from local ZIP archive:</p>
        <div class="image-gallery-row">
          <div class="img-card" onclick="selectSample('qr')">
            <img src="images/sample-qr.svg" alt="QR Code" width="60">
            <span>QR Matrix</span>
          </div>
          <div class="img-card" onclick="selectSample('camera')">
            <img src="images/scanner-icon.svg" alt="Scanner Sensor" width="60">
            <span>Laser Head</span>
          </div>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>OmniScan v2.4 • Client-Side ZIP Preview • All Assets Resolved</p>
    </footer>
  </div>

  <script src="js/scanner.js"></script>
</body>
</html>`;

  const galleryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saved Scans - OmniScan</title>
  <link rel="stylesheet" href="css/scanner.css">
</head>
<body>
  <div class="app-layout">
    <header class="app-header">
      <div class="brand">
        <img src="images/scanner-icon.svg" alt="Scanner Logo" class="brand-icon">
        <span class="brand-name">OmniScan <strong>PRO</strong></span>
      </div>
      <nav class="top-nav">
        <a href="index.html" class="nav-btn">Live View</a>
        <a href="gallery.html" class="nav-btn active">Saved Scans</a>
        <a href="settings.html" class="nav-btn">Config</a>
      </nav>
    </header>

    <main class="scanner-main">
      <h2>Scanned Document Archive</h2>
      <p style="color:#94a3b8; font-size: 13px; margin-bottom: 20px;">History stored and loaded from ZIP package:</p>

      <div class="gallery-grid">
        <div class="history-item">
          <img src="images/sample-qr.svg" alt="Scan #101" class="thumb">
          <div class="info">
            <h4>Inventory Tag #A-482</h4>
            <p>Decoded: 2026-10-31 • Format: QR_CODE</p>
          </div>
        </div>
        <div class="history-item">
          <img src="images/scanner-icon.svg" alt="Scan #102" class="thumb">
          <div class="info">
            <h4>Hardware Serial #SN-99120</h4>
            <p>Decoded: 2026-10-31 • Format: CODE_128</p>
          </div>
        </div>
      </div>

      <div style="margin-top: 30px;">
        <a href="index.html" class="btn-action" style="display:inline-block; text-decoration:none;">← Back to Scanner</a>
      </div>
    </main>
  </div>
</body>
</html>`;

  const settingsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings - OmniScan</title>
  <link rel="stylesheet" href="css/scanner.css">
</head>
<body>
  <div class="app-layout">
    <header class="app-header">
      <div class="brand">
        <img src="images/scanner-icon.svg" alt="Scanner Logo" class="brand-icon">
        <span class="brand-name">OmniScan <strong>PRO</strong></span>
      </div>
      <nav class="top-nav">
        <a href="index.html" class="nav-btn">Live View</a>
        <a href="gallery.html" class="nav-btn">Saved Scans</a>
        <a href="settings.html" class="nav-btn active">Config</a>
      </nav>
    </header>

    <main class="scanner-main" style="max-width: 500px;">
      <h2>Scanner Configuration</h2>
      <div class="config-box">
        <label><input type="checkbox" checked> Auto-beep on valid scan</label>
        <label><input type="checkbox" checked> Highlight laser viewfinder</label>
        <label><input type="checkbox"> Enable front-facing camera</label>
        <label><input type="checkbox" checked> Offline local database sync</label>
      </div>

      <div style="margin-top: 25px;">
        <a href="index.html" class="btn-action" style="display:inline-block; text-decoration:none;">Apply & Return</a>
      </div>
    </main>
  </div>
</body>
</html>`;

  const gridBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <rect width="40" height="40" fill="#0b1120"/>
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1"/>
  </svg>`;

  const scannerCss = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  background: #020617;
  color: #f8fafc;
  min-height: 100vh;
}

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 32px;
  height: 32px;
}

.brand-name {
  font-size: 16px;
  color: #e2e8f0;
}

.brand-name strong {
  color: #38bdf8;
  font-size: 12px;
  background: rgba(56, 189, 248, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.top-nav {
  display: flex;
  gap: 8px;
}

.nav-btn {
  color: #94a3b8;
  text-decoration: none;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-btn:hover, .nav-btn.active {
  color: white;
  background: #1e293b;
}

.scanner-main {
  max-width: 760px;
  margin: 0 auto;
  padding: 30px 16px;
  width: 100%;
  flex: 1;
}

.viewfinder-card {
  background-color: #0b1120;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.scanner-frame {
  position: relative;
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  overflow: hidden;
}

.laser-beam {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #ef4444;
  box-shadow: 0 0 12px #ef4444;
  animation: scanSweep 2s ease-in-out infinite alternate;
  z-index: 10;
}

@keyframes scanSweep {
  0% { top: 5%; }
  100% { top: 95%; }
}

.qr-target-preview img {
  width: 140px;
  height: 140px;
  display: block;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #38bdf8;
  border-style: solid;
}

.corner.tl { top: 8px; left: 8px; border-width: 4px 0 0 4px; }
.corner.tr { top: 8px; right: 8px; border-width: 4px 4px 0 0; }
.corner.bl { bottom: 8px; left: 8px; border-width: 0 0 4px 4px; }
.corner.br { bottom: 8px; right: 8px; border-width: 0 4px 4px 0; }

.scanner-controls {
  margin-top: 25px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-action {
  background: #0284c7;
  color: white;
  border: none;
  font-weight: 700;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
  transition: all 0.15s;
}

.btn-action:hover {
  background: #0369a1;
  transform: translateY(-1px);
}

.scan-result {
  margin-top: 18px;
  background: #032030;
  border: 1px solid #0284c7;
  border-radius: 8px;
  padding: 12px 18px;
  text-align: center;
}

.result-badge {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.5px;
}

.scan-result p {
  color: #f1f5f9;
  font-family: monospace;
  font-size: 13px;
  margin-top: 4px;
}

.recent-scans-tray {
  margin-top: 30px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.recent-scans-tray h3 {
  font-size: 14px;
  color: #f8fafc;
}

.hint {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 15px;
}

.image-gallery-row {
  display: flex;
  gap: 15px;
}

.img-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #1e293b;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  border: 1px solid transparent;
}

.img-card:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
}

.img-card span {
  font-size: 11px;
  color: #cbd5e1;
}

.gallery-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #0f172a;
  border: 1px solid #1e293b;
  padding: 12px 16px;
  border-radius: 10px;
}

.history-item .thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  background: #020617;
  padding: 4px;
}

.history-item h4 {
  font-size: 13px;
  color: #f1f5f9;
}

.history-item p {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.config-box {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.config-box label {
  font-size: 14px;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.app-footer {
  margin-top: auto;
  padding: 16px;
  text-align: center;
  border-top: 1px solid #1e293b;
  font-size: 11px;
  color: #64748b;
}
`;

  const scannerJs = `
const scanBtn = document.getElementById('scanBtn');
const scanResult = document.getElementById('scanResult');
const resultText = document.getElementById('resultText');

if (scanBtn) {
  scanBtn.addEventListener('click', () => {
    scanResult.style.display = 'block';
    const randomId = Math.floor(1000 + Math.random() * 9000);
    resultText.textContent = 'https://inventory.local/sku/' + randomId;
    console.log('✓ Target successfully decoded:', resultText.textContent);
  });
}

function selectSample(type) {
  const targetImg = document.getElementById('targetImg');
  if (!targetImg) return;
  if (type === 'camera') {
    targetImg.src = 'images/scanner-icon.svg';
  } else {
    targetImg.src = 'images/sample-qr.svg';
  }
  console.log('Switched scanner sample target image to:', type);
}

console.log('✦ OmniScan engine initialized with local ZIP images and styles.');
`;

  zip.file('index.html', indexHtml);
  zip.file('gallery.html', galleryHtml);
  zip.file('settings.html', settingsHtml);
  zip.file('css/scanner.css', scannerCss);
  zip.file('js/scanner.js', scannerJs);
  zip.file('images/scanner-icon.svg', scannerSvg);
  zip.file('images/sample-qr.svg', qrSvg);
  zip.file('images/grid-bg.svg', gridBgSvg);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return parseZipArchive(zipBlob, 'omniscan-barcode-scanner.zip');
}

/**
 * Creates an interactive multi-page SaaS portfolio website in a ZIP
 */
export async function createSaasDemoZip(): Promise<ZipProject> {
  const zip = new JSZip();

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Dynamics - AI Platform</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">✦ APEX.IO</div>
    <div class="nav-links">
      <a href="index.html" class="active">Home</a>
      <a href="features.html">Features</a>
      <a href="pricing.html">Pricing</a>
      <a href="contact.html">Contact</a>
    </div>
    <button class="btn-primary" onclick="alert('Welcome to Apex IO!')">Get Started</button>
  </nav>

  <header class="hero">
    <div class="badge">🚀 v3.5 Generation is Live</div>
    <h1>Build Websites Faster Than Thought</h1>
    <p>The unified workspace for developers, designers, and creators to deploy anywhere.</p>
    <div class="hero-actions">
      <a href="pricing.html" class="btn-primary">Explore Plans</a>
      <a href="features.html" class="btn-secondary">View Showcase →</a>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3 id="speedCounter">99.98%</h3>
        <p>Uptime SLA</p>
      </div>
      <div class="stat-card">
        <h3>12M+</h3>
        <p>Monthly Requests</p>
      </div>
      <div class="stat-card">
        <h3>140+</h3>
        <p>Edge Locations</p>
      </div>
    </div>
  </header>

  <section class="section">
    <h2>Explore Multi-Page Navigation</h2>
    <p>This demo has multiple linked pages inside this ZIP archive. Click any link below to test internal routing!</p>
    <div class="cards-grid">
      <a href="features.html" class="feature-card">
        <div class="icon">⚡</div>
        <h3>Ultra Speed</h3>
        <p>Zero cold starts, edge caching, and global instant replication.</p>
        <span class="link-label">Learn more →</span>
      </a>
      <a href="pricing.html" class="feature-card">
        <div class="icon">💎</div>
        <h3>Transparent Plans</h3>
        <p>Start free, scale seamlessly when your product goes viral.</p>
        <span class="link-label">View pricing →</span>
      </a>
      <a href="contact.html" class="feature-card">
        <div class="icon">✉️</div>
        <h3>Direct Support</h3>
        <p>24/7 engineering response within 5 minutes guaranteed.</p>
        <span class="link-label">Talk to team →</span>
      </a>
    </div>
  </section>

  <footer>
    <p>© 2026 Apex Dynamics Inc. Live Previewed with WebZip Live.</p>
  </footer>

  <script src="assets/main.js"></script>
</body>
</html>`;

  const featuresHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Features - Apex Dynamics</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">✦ APEX.IO</div>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="features.html" class="active">Features</a>
      <a href="pricing.html">Pricing</a>
      <a href="contact.html">Contact</a>
    </div>
    <a href="pricing.html" class="btn-primary">Get Started</a>
  </nav>

  <div class="container section">
    <div class="badge">Platform Architecture</div>
    <h1>Engineered for Extreme Performance</h1>
    <p>Discover the technologies powering the fastest developer clouds.</p>

    <div class="feature-detail-grid">
      <div class="detail-box">
        <h3>1. Smart Virtual File Routing</h3>
        <p>Preview websites instantly without uploading to external servers or installing runtimes.</p>
      </div>
      <div class="detail-box">
        <h3>2. Atomic Sandboxing</h3>
        <p>Every preview executes safely inside an isolated environment with instant reset capabilities.</p>
      </div>
      <div class="detail-box">
        <h3>3. Asset Resolution Pipeline</h3>
        <p>CSS, JavaScript, SVG, and web fonts resolve with zero configuration.</p>
      </div>
    </div>

    <div style="margin-top: 40px; text-align: center;">
      <a href="index.html" class="btn-secondary">← Back to Home</a>
      <a href="pricing.html" class="btn-primary" style="margin-left: 12px;">See Pricing</a>
    </div>
  </div>

  <footer>
    <p>© 2026 Apex Dynamics Inc. Live Previewed with WebZip Live.</p>
  </footer>
</body>
</html>`;

  const pricingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing - Apex Dynamics</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">✦ APEX.IO</div>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="features.html">Features</a>
      <a href="pricing.html" class="active">Pricing</a>
      <a href="contact.html">Contact</a>
    </div>
    <button class="btn-primary">Sign In</button>
  </nav>

  <div class="container section">
    <h1>Simple, Predictable Pricing</h1>
    <p>Everything you need to preview, test, and ship your web apps.</p>

    <div class="pricing-cards">
      <div class="pricing-card">
        <h3>Starter</h3>
        <div class="price">$0<span>/mo</span></div>
        <p>For independent developers & prototypes.</p>
        <ul>
          <li>✓ Unlimited ZIP extractions</li>
          <li>✓ Client-side preview</li>
          <li>✓ Code inspector</li>
        </ul>
        <a href="contact.html" class="btn-secondary" style="display:block; text-align:center;">Select Starter</a>
      </div>

      <div class="pricing-card featured">
        <div class="popular-badge">POPULAR</div>
        <h3>Pro Studio</h3>
        <div class="price">$19<span>/mo</span></div>
        <p>For high-velocity product teams.</p>
        <ul>
          <li>✓ Everything in Starter</li>
          <li>✓ Team share links</li>
          <li>✓ Real-time console logs</li>
          <li>✓ Responsive test viewports</li>
        </ul>
        <a href="contact.html" class="btn-primary" style="display:block; text-align:center;">Start Free Trial</a>
      </div>
    </div>

    <div style="margin-top: 40px; text-align: center;">
      <a href="index.html" class="btn-secondary">← Return to Home</a>
    </div>
  </div>

  <footer>
    <p>© 2026 Apex Dynamics Inc. Live Previewed with WebZip Live.</p>
  </footer>
</body>
</html>`;

  const contactHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us - Apex Dynamics</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">✦ APEX.IO</div>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="features.html">Features</a>
      <a href="pricing.html">Pricing</a>
      <a href="contact.html" class="active">Contact</a>
    </div>
  </nav>

  <div class="container section" style="max-width: 600px;">
    <h1>Get in Touch</h1>
    <p>Have questions about zip previews or custom enterprise deployments?</p>

    <form class="contact-form" onsubmit="event.preventDefault(); document.getElementById('msgStatus').style.display='block';">
      <div class="form-group">
        <label>Your Name</label>
        <input type="text" required placeholder="Alex Rivera">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" required placeholder="alex@company.com">
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea rows="4" required placeholder="Tell us about your project..."></textarea>
      </div>
      <button type="submit" class="btn-primary" style="width: 100%;">Send Message</button>
      <div id="msgStatus" style="display:none; color: #10b981; margin-top: 15px; font-weight: 600; text-align: center;">
        ✓ Message dispatched successfully!
      </div>
    </form>

    <div style="margin-top: 30px; text-align: center;">
      <a href="index.html" class="btn-secondary">← Return to Home</a>
    </div>
  </div>
</body>
</html>`;

  const cssContent = `
:root {
  --bg: #090d16;
  --card-bg: #111827;
  --text: #f3f4f6;
  --muted: #9ca3af;
  --accent: #6366f1;
  --accent-hover: #4f46e5;
  --border: #1f2937;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  background-color: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  background: rgba(9, 13, 22, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.logo {
  font-weight: 800;
  font-size: 1.25rem;
  color: #fff;
  letter-spacing: -0.03em;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover, .nav-links a.active {
  color: #fff;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: transform 0.15s, opacity 0.15s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

.btn-secondary {
  background: #1f2937;
  color: #e5e7eb;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid #374151;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #374151;
}

.hero {
  padding: 5rem 2rem 3rem;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 1.25rem;
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  color: var(--muted);
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
}

.stat-card h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #a5b4fc;
}

.section {
  padding: 4rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.section h2 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.section > p {
  text-align: center;
  color: var(--muted);
  margin-bottom: 2.5rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.75rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  border-color: #6366f1;
  transform: translateY(-3px);
}

.feature-card .icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: var(--muted);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.link-label {
  color: #818cf8;
  font-weight: 600;
  font-size: 0.9rem;
}

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.pricing-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  position: relative;
}

.pricing-card.featured {
  border-color: #6366f1;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
}

.popular-badge {
  position: absolute;
  top: -12px;
  right: 24px;
  background: #6366f1;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.price {
  font-size: 3rem;
  font-weight: 800;
  margin: 1rem 0;
}

.price span {
  font-size: 1rem;
  color: var(--muted);
}

.pricing-card ul {
  list-style: none;
  margin: 1.5rem 0 2rem;
}

.pricing-card li {
  padding: 0.5rem 0;
  color: #cbd5e1;
}

.contact-form {
  background: var(--card-bg);
  border: 1px solid var(--border);
  padding: 2rem;
  border-radius: 14px;
}

.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  color: var(--muted);
}

.form-group input, .form-group textarea {
  background: #090d16;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: white;
  font-size: 1rem;
}

.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #6366f1;
}

footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  padding: 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}
`;

  const jsContent = `
console.log('✦ Apex IO Platform scripts loaded successfully.');
console.info('Live multi-page ZIP preview active.');

// Simple counter animation
let count = 99.85;
const el = document.getElementById('speedCounter');
if (el) {
  const timer = setInterval(() => {
    count = Math.min(99.98, count + 0.01);
    el.innerText = count.toFixed(2) + '%';
    if (count >= 99.98) clearInterval(timer);
  }, 200);
}
`;

  zip.file('index.html', indexHtml);
  zip.file('features.html', featuresHtml);
  zip.file('pricing.html', pricingHtml);
  zip.file('contact.html', contactHtml);
  zip.file('assets/style.css', cssContent);
  zip.file('assets/main.js', jsContent);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return parseZipArchive(zipBlob, 'apex-saas-template.zip');
}

/**
 * Creates an interactive playable Neon Arcade Game in a ZIP
 */
export async function createArcadeGameZip(): Promise<ZipProject> {
  const zip = new JSZip();

  const gameHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Dodger - Retro HTML5 Game</title>
  <link rel="stylesheet" href="game.css">
</head>
<body>
  <div class="game-container">
    <div class="hud">
      <div class="hud-item">SCORE: <span id="scoreVal">0</span></div>
      <div class="hud-item title">⚡ NEON DODGER ⚡</div>
      <div class="hud-item">BEST: <span id="highScoreVal">0</span></div>
    </div>

    <div class="canvas-wrapper">
      <canvas id="gameCanvas" width="600" height="400"></canvas>
      <div id="startOverlay" class="overlay">
        <h2>PRESS SPACE OR CLICK TO PLAY</h2>
        <p>Use LEFT / RIGHT arrows or A / D keys (or drag mouse) to dodge falling neon asteroids!</p>
        <button id="startBtn" class="btn-play">START GAME</button>
      </div>
    </div>

    <div class="controls-hint">
      <span>Controls: Arrow Keys / [A][D] or Touch / Mouse Drag</span>
    </div>
  </div>

  <script src="game.js"></script>
</body>
</html>`;

  const gameCss = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #05050c;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #0b0c16;
  padding: 20px;
  border-radius: 16px;
  border: 2px solid #2a2c4e;
  box-shadow: 0 0 35px rgba(110, 64, 255, 0.25);
}

.hud {
  display: flex;
  justify-content: space-between;
  width: 600px;
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 1px;
}

.hud-item.title {
  color: #00f3ff;
  text-shadow: 0 0 10px #00f3ff;
}

.canvas-wrapper {
  position: relative;
  width: 600px;
  height: 400px;
}

canvas {
  background: radial-gradient(circle at center, #131428 0%, #060711 100%);
  border-radius: 8px;
  border: 1px solid #3d4175;
  display: block;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(5, 5, 12, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 30px;
  border-radius: 8px;
}

.overlay h2 {
  color: #ff007f;
  text-shadow: 0 0 15px #ff007f;
  margin-bottom: 15px;
  font-size: 22px;
}

.overlay p {
  color: #a0a6d6;
  font-size: 14px;
  margin-bottom: 25px;
  max-width: 420px;
  line-height: 1.5;
}

.btn-play {
  background: #00f3ff;
  color: #05050c;
  font-family: inherit;
  font-weight: 900;
  font-size: 16px;
  padding: 12px 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.6);
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn-play:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.9);
}

.controls-hint {
  margin-top: 14px;
  color: #636b9e;
  font-size: 12px;
}
`;

  const gameJs = `
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreVal');
const highScoreEl = document.getElementById('highScoreVal');
const overlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');

let player = { x: 280, y: 350, w: 40, h: 20, speed: 7 };
let obstacles = [];
let stars = [];
let score = 0;
let highScore = 0;
let isPlaying = false;
let animationId;
let leftPressed = false;
let rightPressed = false;

// Populate background stars
for (let i = 0; i < 60; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 0.5 + Math.random() * 2,
    size: Math.random() * 2
  });
}

function spawnObstacle() {
  const w = 25 + Math.random() * 40;
  obstacles.push({
    x: Math.random() * (canvas.width - w),
    y: -30,
    w: w,
    h: 18 + Math.random() * 10,
    speed: 3 + Math.random() * 3 + (score / 200),
    color: Math.random() > 0.5 ? '#ff007f' : '#ffe600'
  });
}

function startGame() {
  score = 0;
  obstacles = [];
  player.x = canvas.width / 2 - 20;
  scoreEl.textContent = '0';
  overlay.style.display = 'none';
  isPlaying = true;
  gameLoop();
}

function gameOver() {
  isPlaying = false;
  cancelAnimationFrame(animationId);
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
  }
  overlay.querySelector('h2').textContent = 'GAME OVER - FINAL SCORE: ' + score;
  overlay.style.display = 'flex';
}

function gameLoop() {
  if (!isPlaying) return;

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background Stars
  ctx.fillStyle = '#4f558a';
  for (const s of stars) {
    s.y += s.speed;
    if (s.y > canvas.height) s.y = 0;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  // Move player
  if (leftPressed && player.x > 0) player.x -= player.speed;
  if (rightPressed && player.x < canvas.width - player.w) player.x += player.speed;

  // Draw Player
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#00f3ff';
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  // Spawning
  if (Math.random() < 0.04) {
    spawnObstacle();
  }

  // Update & Draw Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.y += obs.speed;

    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

    // Collision check
    if (
      player.x < obs.x + obs.w &&
      player.x + player.w > obs.x &&
      player.y < obs.y + obs.h &&
      player.y + player.h > obs.y
    ) {
      gameOver();
      return;
    }

    if (obs.y > canvas.height) {
      obstacles.splice(i, 1);
      score += 10;
      scoreEl.textContent = score;
    }
  }

  ctx.shadowBlur = 0;
  animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftPressed = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') rightPressed = true;
  if (e.code === 'Space' && !isPlaying) startGame();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftPressed = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') rightPressed = false;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isPlaying) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  player.x = Math.max(0, Math.min(canvas.width - player.w, mouseX - player.w / 2));
});

startBtn.addEventListener('click', startGame);
console.log('⚡ Neon Dodger game engine ready!');
`;

  zip.file('index.html', gameHtml);
  zip.file('game.css', gameCss);
  zip.file('game.js', gameJs);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return parseZipArchive(zipBlob, 'neon-dodger-game.zip');
}
