import { initStore, getState, persistState } from '../store.js';
import { applyBrandForHelical } from '../brand.js';
import { toggleSidebar, initSidebarFromStorage } from '../shell.js';
import { wireHelpGlobals, setHelpSection } from '../help/guide.js';

const HEALTH_TIMEOUT_MS = 5000;

function normalizeBaseUrl(raw) {
  let base = String(raw || 'https://localhost/hi-ee/').trim();
  if (!base.endsWith('/')) base += '/';
  return base;
}

function applyAuthParams(params, settings = {}) {
  const mode = settings.helicalAuthMode || 'none';
  if (mode === 'url_creds') {
    const user = settings.helicalUsername || '';
    const pass = settings.helicalPassword || '';
    if (user) {
      params.set('username', user);
      params.set('password', pass);
      params.set('j_username', user);
      params.set('j_password', pass);
    }
  } else if (mode === 'token' && settings.helicalAuthToken) {
    params.set('authToken', settings.helicalAuthToken);
  }
}

function isClassicEfw(file) {
  return /\.efw$/i.test(String(file || '').trim());
}

/** URL del tablero SIRH (EFW → getEFWSolution; diseñador → report-viewer). */
export function buildHelicalViewerUrl(settings = {}) {
  const base = normalizeBaseUrl(settings.helicalBaseUrl);
  const dir = String(settings.helicalDir || 'SIRH').trim();
  const file = String(settings.helicalFile || 'Gerencia_SIRH.efw').trim();
  const params = new URLSearchParams();
  params.set('dir', dir);
  params.set('file', file);
  params.set('mode', 'open');
  applyAuthParams(params, settings);

  if (isClassicEfw(file)) {
    return `${base}getEFWSolution?${params.toString()}`;
  }
  return `${base}#/report-viewer?${params.toString()}`;
}

/**
 * URL de entrada:
 * - sin auth → home/login de Helical
 * - con auth → directo al tablero
 */
export function buildHelicalEntryUrl(settings = {}) {
  const mode = settings.helicalAuthMode || 'none';
  const base = normalizeBaseUrl(settings.helicalBaseUrl);
  if (mode === 'none') return base;
  return buildHelicalViewerUrl(settings);
}

async function checkHelicalHealthViaFetch(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    await fetch(normalizeBaseUrl(baseUrl), {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHelicalHealth(baseUrl) {
  const url = normalizeBaseUrl(baseUrl);
  if (window.ddsDesktop?.pingHelical) {
    try {
      const result = await window.ddsDesktop.pingHelical(url);
      if (result && typeof result.ok === 'boolean') return result.ok;
    } catch (_) {
      /* fallback */
    }
  }
  return checkHelicalHealthViaFetch(url);
}

function setStatus(text, kind = 'info') {
  const el = document.getElementById('helical-status');
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
}

function setHint(text) {
  const el = document.getElementById('helical-auth-hint');
  if (el) el.textContent = text || '';
}

function showOffline(baseUrl, entryUrl) {
  const offline = document.getElementById('helical-offline');
  const frame = document.getElementById('helical-frame');
  const configured = document.getElementById('helical-configured-url');
  if (offline) offline.classList.remove('hidden');
  if (frame) {
    frame.classList.add('hidden');
    frame.removeAttribute('src');
  }
  if (configured) configured.textContent = baseUrl;
  const forceBtn = document.getElementById('helical-force-load');
  if (forceBtn) forceBtn.onclick = () => showFrame(entryUrl);
  setStatus('Helical no responde', 'error');
}

function showFrame(url, statusText = 'Conectado a Helical') {
  const offline = document.getElementById('helical-offline');
  const frame = document.getElementById('helical-frame');
  if (offline) offline.classList.add('hidden');
  if (frame) {
    frame.classList.remove('hidden');
    frame.src = url;
  }
  setStatus(statusText, 'ok');
  const urlLabel = document.getElementById('helical-viewer-url');
  if (urlLabel) urlLabel.textContent = url;
}

async function loadHelicalDashboard() {
  const state = getState();
  const settings = state.settings || {};
  const baseUrl = normalizeBaseUrl(settings.helicalBaseUrl);
  const entryUrl = buildHelicalEntryUrl(settings);
  const mode = settings.helicalAuthMode || 'none';

  if (settings.helicalBaseUrl !== baseUrl) {
    settings.helicalBaseUrl = baseUrl;
  }
  if (String(settings.helicalFile || '') === 'Gerencia_SIRH.efwdd') {
    settings.helicalFile = 'Gerencia_SIRH.efw';
  }
  persistState();

  const urlLabel = document.getElementById('helical-viewer-url');
  if (urlLabel) urlLabel.textContent = entryUrl;

  if (mode === 'none') {
    setHint('1) Iniciá sesión (hiadmin). 2) Pulsá «Dashboard SIRH» (abre getEFWSolution del .efw). Si no hay data actualizada, publicá desde SIRH Datos.');
  } else {
    setHint('Modo auth activo. El tablero EFW se abre con getEFWSolution.');
  }

  setStatus('Comprobando Helical…', 'info');
  const ok = await checkHelicalHealth(baseUrl);
  if (!ok) {
    showOffline(baseUrl, entryUrl);
    return;
  }
  showFrame(entryUrl, mode === 'none' ? 'Login Helical' : 'Dashboard SIRH');
}

function openHelicalHome() {
  const base = normalizeBaseUrl(getState().settings?.helicalBaseUrl);
  showFrame(base, 'Login Helical');
  setHint('Iniciá sesión y luego pulsá «Dashboard SIRH».');
}

function openHelicalDashboard() {
  const viewerUrl = buildHelicalViewerUrl(getState().settings || {});
  showFrame(viewerUrl, 'Dashboard SIRH');
  setHint('EFW vía getEFWSolution. Access Denied = sin sesión. Datos vacíos/viejos = Publicar desde SIRH Datos.');
}

function reloadHelicalFrame() {
  loadHelicalDashboard();
}

function openHelicalExternal() {
  const settings = getState().settings || {};
  const url = buildHelicalEntryUrl(settings);
  if (window.ddsDesktop?.openExternal) {
    window.ddsDesktop.openExternal(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function forceLoadHelical() {
  showFrame(buildHelicalEntryUrl(getState().settings || {}));
}

function init() {
  initStore();
  initSidebarFromStorage();
  wireHelpGlobals();
  setHelpSection('helical');
  applyBrandForHelical(getState());

  Object.assign(window, {
    toggleSidebar,
    reloadHelicalFrame,
    openHelicalExternal,
    loadHelicalDashboard,
    forceLoadHelical,
    openHelicalHome,
    openHelicalDashboard,
  });

  loadHelicalDashboard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
