// Color picker para aplicar un filtro de color al canvas del juego.
// Convierte HSV → CSS filter: sepia + hue-rotate + saturate + brightness.

interface HSV { h: number; s: number; v: number }
interface RGB { r: number; g: number; b: number }

function hsvToRgb({ h, s, v }: HSV): RGB {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
}

function rgbToHsv({ r, g, b }: RGB): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s, v: max };
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): RGB | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyColorFilter(hsv: HSV) {
  const canvas = document.querySelector<HTMLElement>('.runner-canvas');
  if (!canvas) return;
  if (hsv.s < 0.05) {
    canvas.style.filter = '';
    return;
  }
  // sepia(1) convierte el sprite B&N a tono sepia, luego hue-rotate y saturate lo colorean.
  canvas.style.filter = `sepia(1) hue-rotate(${hsv.h - 30}deg) saturate(${hsv.s * 5}) brightness(${0.6 + hsv.v * 0.6})`;
}

export function initColorPicker() {
  const panel = document.getElementById('color-panel');
  if (!panel) return;

  const gradCanvas = panel.querySelector<HTMLCanvasElement>('#cp-gradient');
  const hueCanvas = panel.querySelector<HTMLCanvasElement>('#cp-hue');
  const gradCtx = gradCanvas!.getContext('2d')!;
  const hueCtx = hueCanvas!.getContext('2d')!;

  const inR = panel.querySelector<HTMLInputElement>('#cp-r')!;
  const inG = panel.querySelector<HTMLInputElement>('#cp-g')!;
  const inB = panel.querySelector<HTMLInputElement>('#cp-b')!;
  const inH = panel.querySelector<HTMLInputElement>('#cp-h')!;
  const inS = panel.querySelector<HTMLInputElement>('#cp-s')!;
  const inV = panel.querySelector<HTMLInputElement>('#cp-v')!;
  const inHL = panel.querySelector<HTMLInputElement>('#cp-hl')!;
  const inSL = panel.querySelector<HTMLInputElement>('#cp-sl')!;
  const inL = panel.querySelector<HTMLInputElement>('#cp-l')!;
  const inHex = panel.querySelector<HTMLInputElement>('#cp-hex')!;
  const gradCursor = panel.querySelector<HTMLElement>('#cp-grad-cursor')!;
  const hueCursor = panel.querySelector<HTMLElement>('#cp-hue-cursor')!;
  const preview = panel.querySelector<HTMLElement>('#cp-preview')!;

  let hsv: HSV = { h: 210, s: 1, v: 0.8 };

  function drawGradient() {
    const w = gradCanvas!.width, h = gradCanvas!.height;
    const hueColor = `hsl(${hsv.h}, 100%, 50%)`;
    const whiteGrad = gradCtx.createLinearGradient(0, 0, w, 0);
    whiteGrad.addColorStop(0, '#fff');
    whiteGrad.addColorStop(1, hueColor);
    gradCtx.fillStyle = whiteGrad;
    gradCtx.fillRect(0, 0, w, h);
    const blackGrad = gradCtx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, 'transparent');
    blackGrad.addColorStop(1, '#000');
    gradCtx.fillStyle = blackGrad;
    gradCtx.fillRect(0, 0, w, h);
  }

  function drawHue() {
    const h = hueCanvas!.height;
    const grad = hueCtx.createLinearGradient(0, 0, 0, h);
    const stops = [0, 60, 120, 180, 240, 300, 360];
    stops.forEach(deg => grad.addColorStop(deg / 360, `hsl(${deg},100%,50%)`));
    hueCtx.fillStyle = grad;
    hueCtx.fillRect(0, 0, hueCanvas!.width, h);
  }

  function updateCursors() {
    const gw = gradCanvas!.offsetWidth, gh = gradCanvas!.offsetHeight;
    const hw = hueCanvas!.offsetWidth, hh = hueCanvas!.offsetHeight;
    gradCursor.style.left = `${hsv.s * gw}px`;
    gradCursor.style.top = `${(1 - hsv.v) * gh}px`;
    hueCursor.style.top = `${(hsv.h / 360) * hh - hueCursor.offsetHeight / 2}px`;
    hueCursor.style.left = `${hw / 2 - hueCursor.offsetWidth / 2}px`;
  }

  function syncInputs() {
    const rgb = hsvToRgb(hsv);
    const hsl = rgbToHsl(rgb);
    inR.value = String(rgb.r);
    inG.value = String(rgb.g);
    inB.value = String(rgb.b);
    inH.value = String(hsv.h);
    inS.value = String(Math.round(hsv.s * 100));
    inV.value = String(Math.round(hsv.v * 100));
    inHL.value = String(hsl.h);
    inSL.value = String(hsl.s);
    inL.value = String(hsl.l);
    inHex.value = rgbToHex(rgb);
    preview.style.backgroundColor = rgbToHex(rgb);
  }

  function update() {
    drawGradient();
    updateCursors();
    syncInputs();
    applyColorFilter(hsv);
  }

  // ─── Interacción con el gradiente ────────────────────────────────────────
  function pickFromGradient(e: MouseEvent | Touch) {
    const rect = gradCanvas!.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    hsv.s = x / rect.width;
    hsv.v = 1 - y / rect.height;
    update();
  }

  gradCanvas!.addEventListener('mousedown', e => {
    pickFromGradient(e);
    const move = (ev: MouseEvent) => pickFromGradient(ev);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });

  // ─── Interacción con la barra de tono ────────────────────────────────────
  function pickFromHue(e: MouseEvent | Touch) {
    const rect = hueCanvas!.getBoundingClientRect();
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    hsv.h = Math.round((y / rect.height) * 360);
    update();
  }

  hueCanvas!.addEventListener('mousedown', e => {
    pickFromHue(e);
    const move = (ev: MouseEvent) => pickFromHue(ev);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });

  // ─── Inputs numéricos ────────────────────────────────────────────────────
  function onRgbChange() {
    const rgb = { r: parseInt(inR.value) || 0, g: parseInt(inG.value) || 0, b: parseInt(inB.value) || 0 };
    hsv = rgbToHsv(rgb);
    drawGradient();
    updateCursors();
    const hsl = rgbToHsl(rgb);
    inH.value = String(hsv.h); inS.value = String(Math.round(hsv.s * 100)); inV.value = String(Math.round(hsv.v * 100));
    inHL.value = String(hsl.h); inSL.value = String(hsl.s); inL.value = String(hsl.l);
    inHex.value = rgbToHex(rgb);
    preview.style.backgroundColor = rgbToHex(rgb);
    applyColorFilter(hsv);
  }

  [inR, inG, inB].forEach(el => el.addEventListener('input', onRgbChange));

  [inH, inS, inV].forEach(el => el.addEventListener('input', () => {
    hsv = { h: parseInt(inH.value) || 0, s: (parseInt(inS.value) || 0) / 100, v: (parseInt(inV.value) || 0) / 100 };
    update();
  }));

  inHex.addEventListener('change', () => {
    const rgb = hexToRgb(inHex.value);
    if (!rgb) return;
    hsv = rgbToHsv(rgb);
    update();
  });

  // ─── Botón reset ──────────────────────────────────────────────────────────
  panel.querySelector('#cp-reset')?.addEventListener('click', () => {
    const canvas = document.querySelector<HTMLElement>('.runner-canvas');
    if (canvas) canvas.style.filter = '';
    hsv = { h: 210, s: 1, v: 0.8 };
    update();
  });

  // ─── Init ─────────────────────────────────────────────────────────────────
  drawHue();
  update();
}
