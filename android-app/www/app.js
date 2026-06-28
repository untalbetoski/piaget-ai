import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

const APP_ORIGIN = 'https://www.soypiaget.app';
const FALLBACK_ORIGIN = 'https://soypiaget.app';
const DEFAULT_PATH = '/plataforma';
const ALLOWED_HOSTS = new Set(['www.soypiaget.app', 'soypiaget.app']);

const $ = id => document.getElementById(id);
const start = $('start');
const offline = $('offline');
const browser = $('browser');
const frame = $('platformFrame');
const netState = $('netState');
let currentPath = DEFAULT_PATH;
let isOnline = true;

async function bootNativeChrome() {
  try { await StatusBar.setStyle({ style: Style.Dark }); } catch (_) {}
  try { await StatusBar.setBackgroundColor({ color: '#07142f' }); } catch (_) {}
  try { await SplashScreen.hide(); } catch (_) {}
  setTimeout(() => $('splash')?.classList.add('hide'), 850);
}

function safeUrl(path = DEFAULT_PATH) {
  const p = String(path || DEFAULT_PATH);
  if (/^https?:\/\//i.test(p)) {
    const u = new URL(p);
    if (!ALLOWED_HOSTS.has(u.hostname)) return APP_ORIGIN + DEFAULT_PATH;
    return u.href;
  }
  return APP_ORIGIN + (p.startsWith('/') ? p : '/' + p);
}

function setView(name) {
  start.classList.toggle('hidden', name !== 'start');
  offline.classList.toggle('hidden', name !== 'offline');
  browser.classList.toggle('hidden', name !== 'browser');
}

function updateNetworkText() {
  netState.textContent = isOnline ? 'Conectado a Soy Piaget' : 'Sin conexión';
}

async function checkNetwork() {
  try {
    const st = await Network.getStatus();
    isOnline = !!st.connected;
  } catch (_) {
    isOnline = navigator.onLine;
  }
  updateNetworkText();
  return isOnline;
}

async function openPlatform(path = DEFAULT_PATH) {
  currentPath = path || DEFAULT_PATH;
  if (!(await checkNetwork())) { setView('offline'); return; }
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (_) {}
  frame.src = safeUrl(currentPath);
  setView('browser');
}

async function goHome() {
  frame.src = 'about:blank';
  await checkNetwork();
  setView(isOnline ? 'start' : 'offline');
}

async function handleExternalUrl(url) {
  try {
    const u = new URL(url);
    if (ALLOWED_HOSTS.has(u.hostname)) return false;
    await Browser.open({ url: u.href, presentationStyle: 'popover' });
    return true;
  } catch (_) { return false; }
}

$('openPlatform').addEventListener('click', () => openPlatform(DEFAULT_PATH));
$('retry').addEventListener('click', () => openPlatform(currentPath));
$('homeBtn').addEventListener('click', goHome);
$('backBtn').addEventListener('click', async () => {
  try {
    if (frame.contentWindow && frame.src !== 'about:blank') frame.contentWindow.history.back();
    else await goHome();
  } catch (_) { await goHome(); }
});

document.querySelectorAll('.quick-card').forEach(btn => {
  btn.addEventListener('click', () => openPlatform(btn.dataset.target || DEFAULT_PATH));
});

Network.addListener('networkStatusChange', status => {
  isOnline = !!status.connected;
  updateNetworkText();
  if (!isOnline) setView('offline');
});

App.addListener('backButton', async () => {
  if (!browser.classList.contains('hidden')) {
    try { frame.contentWindow.history.back(); }
    catch (_) { await goHome(); }
  } else {
    App.exitApp();
  }
});

window.addEventListener('message', async ev => {
  const data = ev.data || {};
  if (data.type === 'open-external' && data.url) await handleExternalUrl(data.url);
});

window.addEventListener('online', () => { isOnline = true; updateNetworkText(); });
window.addEventListener('offline', () => { isOnline = false; updateNetworkText(); setView('offline'); });

checkNetwork().then(() => bootNativeChrome());
