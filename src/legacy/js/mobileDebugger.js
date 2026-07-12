/**
 * LUNOR MOBILE DEBUGGER — Floating Console & Network Interceptor (Persistent)
 * Extracted verbatim from the inline <script> at the bottom of home.html.
 * Only change: wrapped in an exported init function (with a guard against
 * double-injection) instead of an auto-running IIFE, since React may mount
 * the Home page more than once during the session (e.g. StrictMode, or
 * navigating away and back).
 */
export function initMobileDebugger() {
  if (document.getElementById('lnr-debug-toggle')) return; // already injected

  const uiHTML = `
    <div id="lnr-debug-toggle" style="position:fixed; bottom:20px; right:20px; width:50px; height:50px; background:#4F46E5; color:#fff; border-radius:25px; display:flex; align-items:center; justify-content:center; font-size:24px; z-index:999999; box-shadow:0 4px 12px rgba(0,0,0,0.5); cursor:pointer;">
      🐞
    </div>
    <div id="lnr-debug-panel" style="position:fixed; bottom:80px; right:10px; left:10px; height:60vh; background:#000; border:1px solid #333; border-radius:12px; z-index:999998; display:none; flex-direction:column; box-shadow:0 8px 24px rgba(0,0,0,0.8); overflow:hidden; font-family:monospace;">
      <div style="background:#111; padding:10px; display:flex; justify-content:space-between; border-bottom:1px solid #333;">
        <span style="color:#fff; font-weight:bold;">Mobile Debugger</span>
        <button id="lnr-debug-clear" style="background:#ef4444; color:#fff; border:none; border-radius:4px; padding:2px 8px;">Clear</button>
      </div>
      <div id="lnr-debug-logs" style="flex:1; overflow-y:auto; padding:10px; font-size:12px; line-height:1.4;"></div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = uiHTML;
  document.documentElement.appendChild(wrapper);

  const toggleBtn = document.getElementById('lnr-debug-toggle');
  const panel = document.getElementById('lnr-debug-panel');
  const logsContainer = document.getElementById('lnr-debug-logs');
  const clearBtn = document.getElementById('lnr-debug-clear');

  let panelOpen = false;
  toggleBtn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? 'flex' : 'none';
  });

  const STORAGE_KEY = 'lnr_debug_logs';
  const MAX_LOGS = 150;
  let savedLogs = [];

  try {
    savedLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    savedLogs = [];
  }

  function renderLogToDOM(prefix, color, msgText) {
    const entry = document.createElement('div');
    entry.style.marginBottom = '8px';
    entry.style.borderBottom = '1px solid #222';
    entry.style.paddingBottom = '4px';
    entry.style.wordBreak = 'break-word';
    entry.style.whiteSpace = 'pre-wrap';
    entry.innerHTML = `<strong style="color:${color};">${prefix}</strong> <span style="color:#ddd;">${msgText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  savedLogs.forEach(log => renderLogToDOM(log.prefix, log.color, log.msgText));

  clearBtn.addEventListener('click', () => {
    logsContainer.innerHTML = '';
    savedLogs = [];
    localStorage.removeItem(STORAGE_KEY);
  });

  function logToUI(prefix, color, args) {
    const msgText = Array.from(args).map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2); } catch (e) { return '[Circular or Unparseable Object]'; }
      }
      return String(arg);
    }).join(' ');

    renderLogToDOM(prefix, color, msgText);

    savedLogs.push({ prefix, color, msgText });
    if (savedLogs.length > MAX_LOGS) savedLogs.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLogs));
  }

  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = function (...args) {
    logToUI('[LOG]', '#4ade80', args);
    origLog.apply(console, args);
  };
  console.warn = function (...args) {
    logToUI('[WARN]', '#facc15', args);
    origWarn.apply(console, args);
  };
  console.error = function (...args) {
    logToUI('[ERR]', '#f87171', args);
    origError.apply(console, args);
  };

  window.addEventListener('error', (e) => {
    console.error(`Uncaught Error: ${e.message} at ${e.filename}:${e.lineno}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error(`Unhandled Promise: ${e.reason}`);
  });

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || 'unknown');
    const method = args[1]?.method || 'GET';
    const body = args[1]?.body || '';

    logToUI(`[NET-REQ]`, '#38bdf8', [`${method} ${url}\nPayload:`, body]);

    try {
      const response = await origFetch.apply(this, args);
      const clone = response.clone();
      clone.text().then(text => {
        let resData = text;
        try { resData = JSON.parse(text); } catch (e) {}
        logToUI(`[NET-RES]`, '#c084fc', [`${method} ${url} -> ${response.status}\nResponse:`, resData]);
      }).catch(err => {
        logToUI(`[NET-RES-ERR]`, '#f43f5e', [`Could not parse response:`, err]);
      });
      return response;
    } catch (err) {
      logToUI(`[NET-FAIL]`, '#f43f5e', [`${method} ${url} failed:`, err.message]);
      throw err;
    }
  };

  console.log('Lunor Mobile Debugger Initialized. Awaiting events...');
}
