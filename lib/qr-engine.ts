import QRCode from "qrcode";
import jsQR from "jsqr";

export type QRErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type QRModuleShape = "square" | "rounded" | "circle" | "diamond" | "organic";
export type QRFinderStyle = "square" | "rounded" | "circle";

export interface LocalQROptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: QRErrorCorrectionLevel;
  moduleShape?: QRModuleShape;
  finderStyle?: QRFinderStyle;
  logoText?: string;
  title?: string;
}

export interface ContrastAudit {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  scannable: boolean;
  invertedWarning: boolean;
}

export interface DecodedQRResult {
  content: string;
  version: number;
  corners: Array<{ x: number; y: number }>;
}

export interface WifiQRInput {
  ssid: string;
  password?: string;
  security?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface VCardQRInput {
  firstName: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
  address?: string;
}

export interface EmailQRInput {
  to: string;
  subject?: string;
  body?: string;
}

export interface SmsQRInput {
  phone: string;
  message?: string;
}

export interface MultiQRPart {
  index: number;
  total: number;
  payload: string;
  svg: string;
  dataUrl: string;
}

export interface MultiQRResult {
  parts: MultiQRPart[];
  isMultiPart: boolean;
  totalChars: number;
  totalBytes: number;
}

/** Límite físico binario de un único símbolo QR Versión 40-L según ISO/IEC 18004. */
export const MAX_SINGLE_QR_BYTES = 2953;
/** Límite extendido de prompt / texto estructurado en QR Pro Enterprise (5.000 caracteres). */
export const MAX_PROMPT_CHARS = 5000;
const MAX_QR_CHARS = MAX_SINGLE_QR_BYTES;

/**
 * Normaliza un color hexadecimal a formato #RRGGBB en mayúsculas.
 */
export function normalizeHexColor(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  const cleaned = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split("")
      .map((ch) => ch + ch)
      .join("")
      .toUpperCase();
    return `#${expanded}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return fallback;
}

function hexToChannelValues(hex: string): [number, number, number] {
  const norm = normalizeHexColor(hex, "#000000").slice(1);
  return [
    parseInt(norm.slice(0, 2), 16),
    parseInt(norm.slice(2, 4), 16),
    parseInt(norm.slice(4, 6), 16),
  ];
}

/**
 * Calcula luminancia relativa según WCAG 2.1 §1.4.3.
 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToChannelValues(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Evalúa relación de contraste WCAG 2.1 y legibilidad óptica para lectores QR.
 */
export function calculateContrastRatio(darkHex: string, lightHex: string): ContrastAudit {
  const lumDark = relativeLuminance(darkHex);
  const lumLight = relativeLuminance(lightHex);
  const lighter = Math.max(lumDark, lumLight);
  const darker = Math.min(lumDark, lumLight);
  const ratio = Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  const invertedWarning = lumDark > lumLight;

  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
    scannable: ratio >= 3.0 && !invertedWarning,
    invertedWarning,
  };
}

/**
 * Valida longitud en bytes UTF-8 y presencia real de contenido según ISO/IEC 18004.
 */
export function isValidQRPayload(content: string): boolean {
  if (typeof content !== "string") return false;
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  const byteLength = new TextEncoder().encode(content).byteLength;
  return byteLength <= MAX_QR_CHARS;
}

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(input: WifiQRInput): string {
  const ssid = input.ssid.trim();
  if (!ssid) {
    throw new Error("El SSID de la red Wi-Fi es obligatorio");
  }
  const security = input.security ?? "WPA";
  const parts = [`WIFI:T:${security}`, `S:${escapeWifiField(ssid)}`];
  if (security !== "nopass" && input.password) {
    parts.push(`P:${escapeWifiField(input.password)}`);
  }
  if (input.hidden) {
    parts.push("H:true");
  }
  return `${parts.join(";")};;`;
}

function escapeVCardField(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

export function buildVCardPayload(input: VCardQRInput): string {
  const first = input.firstName.trim();
  const last = (input.lastName ?? "").trim();
  if (!first && !last) {
    throw new Error("El nombre del contacto es obligatorio");
  }
  const fullName = [first, last].filter(Boolean).join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardField(last)};${escapeVCardField(first)};;;`,
    `FN:${escapeVCardField(fullName)}`,
  ];
  if (input.organization?.trim()) lines.push(`ORG:${escapeVCardField(input.organization.trim())}`);
  if (input.title?.trim()) lines.push(`TITLE:${escapeVCardField(input.title.trim())}`);
  if (input.phone?.trim()) lines.push(`TEL;TYPE=CELL:${input.phone.trim()}`);
  if (input.email?.trim()) lines.push(`EMAIL;TYPE=INTERNET:${input.email.trim()}`);
  if (input.url?.trim()) lines.push(`URL:${input.url.trim()}`);
  if (input.address?.trim()) lines.push(`ADR;TYPE=WORK:;;${escapeVCardField(input.address.trim())};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function buildEmailPayload(input: EmailQRInput): string {
  const to = input.to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new Error("Dirección de correo electrónico no válida");
  }
  const params = new URLSearchParams();
  if (input.subject?.trim()) params.set("subject", input.subject.trim());
  if (input.body?.trim()) params.set("body", input.body.trim());
  const qs = params.toString().replace(/\+/g, "%20");
  return qs ? `mailto:${to}?${qs}` : `mailto:${to}`;
}

export function buildSmsPayload(input: SmsQRInput): string {
  const phone = input.phone.trim().replace(/[^\d+]/g, "");
  if (!phone) {
    throw new Error("Número de teléfono obligatorio para SMS");
  }
  return input.message?.trim() ? `SMSTO:${phone}:${input.message.trim()}` : `SMSTO:${phone}`;
}

export function buildPhonePayload(phone: string): string {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (!cleaned) {
    throw new Error("Número de teléfono no válido");
  }
  return `tel:${cleaned}`;
}

export function buildUrlPayload(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error("La URL no puede estar vacía");
  }
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error("Dominio de URL no válido");
  }
  return parsed.toString();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isInFinderPattern(row: number, col: number, matrixSize: number): boolean {
  const topLeft = row < 7 && col < 7;
  const topRight = row < 7 && col >= matrixSize - 7;
  const bottomLeft = row >= matrixSize - 7 && col < 7;
  return topLeft || topRight || bottomLeft;
}

function renderFinderPatternSVG(
  originX: number,
  originY: number,
  style: QRFinderStyle,
  darkColor: string,
  lightColor: string
): string {
  if (style === "circle") {
    const cx = originX + 3.5;
    const cy = originY + 3.5;
    return [
      `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${darkColor}"/>`,
      `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${lightColor}"/>`,
      `<circle cx="${cx}" cy="${cy}" r="1.5" fill="${darkColor}"/>`,
    ].join("");
  }

  const outerRx = style === "rounded" ? 1.4 : 0;
  const midRx = style === "rounded" ? 0.9 : 0;
  const innerRx = style === "rounded" ? 0.6 : 0;

  return [
    `<rect x="${originX}" y="${originY}" width="7" height="7" rx="${outerRx}" fill="${darkColor}"/>`,
    `<rect x="${originX + 1}" y="${originY + 1}" width="5" height="5" rx="${midRx}" fill="${lightColor}"/>`,
    `<rect x="${originX + 2}" y="${originY + 2}" width="3" height="3" rx="${innerRx}" fill="${darkColor}"/>`,
  ].join("");
}

function renderModuleSVG(x: number, y: number, shape: QRModuleShape, darkColor: string): string {
  switch (shape) {
    case "circle":
      return `<circle cx="${(x + 0.5).toFixed(2)}" cy="${(y + 0.5).toFixed(2)}" r="0.44" fill="${darkColor}"/>`;
    case "rounded":
      return `<rect x="${(x + 0.05).toFixed(2)}" y="${(y + 0.05).toFixed(2)}" width="0.9" height="0.9" rx="0.28" fill="${darkColor}"/>`;
    case "diamond": {
      const cx = (x + 0.5).toFixed(2);
      const cy = (y + 0.5).toFixed(2);
      return `<polygon points="${cx},${y.toFixed(2)} ${(x + 1).toFixed(2)},${cy} ${cx},${(y + 1).toFixed(2)} ${x.toFixed(2)},${cy}" fill="${darkColor}"/>`;
    }
    case "organic":
      return `<rect x="${(x + 0.04).toFixed(2)}" y="${(y + 0.04).toFixed(2)}" width="0.92" height="0.92" rx="0.4" fill="${darkColor}"/>`;
    case "square":
    default:
      return `<rect x="${x}" y="${y}" width="1" height="1" fill="${darkColor}"/>`;
  }
}

function createQRWithAdaptiveECC(
  content: string,
  preferred: QRErrorCorrectionLevel
): { qr: ReturnType<typeof QRCode.create>; usedLevel: QRErrorCorrectionLevel } {
  const orderMap: Record<QRErrorCorrectionLevel, QRErrorCorrectionLevel[]> = {
    H: ["H", "Q", "M", "L"],
    Q: ["Q", "M", "L"],
    M: ["M", "L"],
    L: ["L"],
  };
  const candidates = orderMap[preferred];
  let lastErr: unknown;
  for (const level of candidates) {
    try {
      return { qr: QRCode.create(content, { errorCorrectionLevel: level }), usedLevel: level };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("No se pudo codificar la matriz QR");
}

/**
 * Valida que un prompt o bloque de texto esté dentro del rango admitido de hasta 5.000 caracteres.
 */
export function isValidExtendedPrompt(content: string): boolean {
  if (typeof content !== "string") return false;
  const trimmed = content.trim();
  return trimmed.length > 0 && content.length <= MAX_PROMPT_CHARS;
}

/**
 * Fragmenta de forma determinista textos o prompts largos (hasta 5.000 caracteres)
 * respetando puntos de código UTF-8 y límites ISO/IEC 18004 por símbolo.
 */
export function splitPayloadForMultiQR(content: string, maxBytesPerChunk = 1800): string[] {
  if (!isValidExtendedPrompt(content)) {
    throw new Error(`El contenido debe tener entre 1 y ${MAX_PROMPT_CHARS} caracteres`);
  }
  const encoder = new TextEncoder();
  if (encoder.encode(content).byteLength <= maxBytesPerChunk) {
    return [content];
  }

  const rawChunks: string[] = [];
  let current = "";
  let currentBytes = 0;
  const safeLimit = Math.max(256, maxBytesPerChunk - 24);

  for (const codePoint of content) {
    const cpBytes = encoder.encode(codePoint).byteLength;
    if (currentBytes + cpBytes > safeLimit && current.length > 0) {
      rawChunks.push(current);
      current = codePoint;
      currentBytes = cpBytes;
    } else {
      current += codePoint;
      currentBytes += cpBytes;
    }
  }
  if (current.length > 0) {
    rawChunks.push(current);
  }

  const total = rawChunks.length;
  return rawChunks.map((chunk, idx) => `[QRP ${idx + 1}/${total}] ${chunk}`);
}

/**
 * Reconstruye el texto/prompt original de hasta 5.000 caracteres a partir de partes [QRP i/N].
 */
export function reassembleMultiQRPayloads(payloads: string[]): string {
  if (payloads.length === 0) return "";
  if (payloads.length === 1 && !payloads[0].startsWith("[QRP ")) {
    return payloads[0];
  }
  const parsed = payloads.map((item) => {
    const match = /^\[QRP (\d+)\/(\d+)\] ([\s\S]*)$/.exec(item);
    if (!match) {
      return { index: 1, total: 1, body: item };
    }
    return {
      index: Number.parseInt(match[1], 10),
      total: Number.parseInt(match[2], 10),
      body: match[3],
    };
  });
  parsed.sort((a, b) => a.index - b.index);
  return parsed.map((p) => p.body).join("");
}

/**
 * Genera un código QR vectorial SVG 100% local conforme a ISO/IEC 18004,
 * soportando formas modulares personalizadas, estilos de finder pattern y emblema central.
 */
export function generateLocalQRSVG(content: string, options: LocalQROptions = {}): string {
  if (!isValidQRPayload(content)) {
    throw new Error("Contenido QR vacío o superior al límite ISO de 2953 bytes");
  }

  const width = Math.max(64, Math.min(4096, Math.round(options.width ?? 320)));
  const margin = Math.max(1, Math.min(10, Math.round(options.margin ?? 2)));
  const darkColor = normalizeHexColor(options.darkColor, "#000000");
  const lightColor = normalizeHexColor(options.lightColor, "#FFFFFF");
  const requestedLogo = Boolean(options.logoText?.trim());
  const preferredECC: QRErrorCorrectionLevel = requestedLogo
    ? "H"
    : (options.errorCorrectionLevel ?? "M");
  const moduleShape = options.moduleShape ?? "square";
  const finderStyle = options.finderStyle ?? (moduleShape === "square" ? "square" : "rounded");

  const { qr, usedLevel } = createQRWithAdaptiveECC(content, preferredECC);
  const hasLogo = requestedLogo && usedLevel === "H";
  const matrixSize = qr.modules.size;
  const totalViewSize = matrixSize + margin * 2;

  const cutoutRadius = hasLogo ? Math.max(2, Math.floor(matrixSize * 0.14)) : 0;
  const centerIdx = (matrixSize - 1) / 2;

  const elements: string[] = [];
  const titleText = escapeXml(options.title ?? "Código QR generado localmente por QR Pro Enterprise");

  elements.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalViewSize} ${totalViewSize}" width="${width}" height="${width}" role="img" aria-label="${titleText}" shape-rendering="geometricPrecision">`,
    `<title>${titleText}</title>`,
    `<rect width="${totalViewSize}" height="${totalViewSize}" fill="${lightColor}"/>`
  );

  elements.push(
    renderFinderPatternSVG(margin, margin, finderStyle, darkColor, lightColor),
    renderFinderPatternSVG(margin + matrixSize - 7, margin, finderStyle, darkColor, lightColor),
    renderFinderPatternSVG(margin, margin + matrixSize - 7, finderStyle, darkColor, lightColor)
  );

  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      if (isInFinderPattern(row, col, matrixSize)) continue;
      if (
        hasLogo &&
        Math.abs(row - centerIdx) <= cutoutRadius &&
        Math.abs(col - centerIdx) <= cutoutRadius
      ) {
        continue;
      }
      if (qr.modules.get(row, col)) {
        elements.push(renderModuleSVG(col + margin, row + margin, moduleShape, darkColor));
      }
    }
  }

  if (hasLogo && options.logoText) {
    const badgeText = escapeXml(options.logoText.trim().slice(0, 4).toUpperCase());
    const boxSize = cutoutRadius * 2 + 0.6;
    const boxOrigin = margin + centerIdx - boxSize / 2 + 0.5;
    const textCenter = margin + centerIdx + 0.5;
    elements.push(
      `<rect x="${boxOrigin.toFixed(2)}" y="${boxOrigin.toFixed(2)}" width="${boxSize.toFixed(2)}" height="${boxSize.toFixed(2)}" rx="1.1" fill="${lightColor}" stroke="${darkColor}" stroke-width="0.35"/>`,
      `<text x="${textCenter.toFixed(2)}" y="${textCenter.toFixed(2)}" text-anchor="middle" dominant-baseline="central" fill="${darkColor}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${(boxSize * 0.42).toFixed(2)}">${badgeText}</text>`
    );
  }

  elements.push("</svg>");
  return elements.join("");
}

/**
 * Convierte un SVG en Data URL listo para etiquetas <Image> o enlaces de descarga.
 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Genera un Data URL PNG local (base64) sin llamadas de red externas.
 */
export async function generateLocalQRPngDataUrl(
  content: string,
  options: LocalQROptions = {}
): Promise<string> {
  if (!isValidQRPayload(content)) {
    throw new Error("Contenido QR vacío o superior al límite ISO de 2953 bytes");
  }
  const { usedLevel } = createQRWithAdaptiveECC(content, options.errorCorrectionLevel ?? "M");
  return QRCode.toDataURL(content, {
    width: options.width ?? 320,
    margin: options.margin ?? 2,
    errorCorrectionLevel: usedLevel,
    color: {
      dark: normalizeHexColor(options.darkColor, "#000000"),
      light: normalizeHexColor(options.lightColor, "#FFFFFF"),
    },
  });
}

/**
 * Genera uno o varios códigos QR SVG encadenados automáticamente para soportar
 * prompts y documentos extensos de hasta 5.000 caracteres sin pérdida de escaneabilidad.
 */
export function generateMultiPartQRSVG(
  content: string,
  options: LocalQROptions = {}
): MultiQRResult {
  if (!isValidExtendedPrompt(content)) {
    throw new Error(`El prompt o contenido debe tener entre 1 y ${MAX_PROMPT_CHARS} caracteres`);
  }
  const totalChars = content.length;
  const totalBytes = new TextEncoder().encode(content).byteLength;

  if (totalBytes <= 2200) {
    const svg = generateLocalQRSVG(content, options);
    return {
      parts: [
        {
          index: 1,
          total: 1,
          payload: content,
          svg,
          dataUrl: svgToDataUrl(svg),
        },
      ],
      isMultiPart: false,
      totalChars,
      totalBytes,
    };
  }

  const chunks = splitPayloadForMultiQR(content, 1800);
  const parts: MultiQRPart[] = chunks.map((payload, idx) => {
    const svg = generateLocalQRSVG(payload, {
      ...options,
      title: `${options.title ?? "QR Pro Secuencia"} (${idx + 1}/${chunks.length})`,
    });
    return {
      index: idx + 1,
      total: chunks.length,
      payload,
      svg,
      dataUrl: svgToDataUrl(svg),
    };
  });

  return {
    parts,
    isMultiPart: parts.length > 1,
    totalChars,
    totalBytes,
  };
}

/**
 * Rasteriza la matriz QR directamente a un buffer RGBA (Uint8ClampedArray) en memoria,
 * útil para tests deterministas, esteganografía y procesamiento sin Canvas nativo.
 */
export function rasterizeQRMatrixToRGBA(
  content: string,
  options: { scale?: number; margin?: number; darkColor?: string; lightColor?: string; errorCorrectionLevel?: QRErrorCorrectionLevel } = {}
): { data: Uint8ClampedArray; width: number; height: number; version: number } {
  if (!isValidQRPayload(content)) {
    throw new Error("Contenido QR no válido para rasterización");
  }
  const { qr } = createQRWithAdaptiveECC(content, options.errorCorrectionLevel ?? "M");
  const scale = Math.max(2, Math.min(32, Math.round(options.scale ?? 8)));
  const margin = Math.max(2, Math.min(10, Math.round(options.margin ?? 4)));
  const totalModules = qr.modules.size + margin * 2;
  const width = totalModules * scale;
  const height = totalModules * scale;
  const data = new Uint8ClampedArray(width * height * 4);

  const [dr, dg, db] = hexToChannelValues(options.darkColor ?? "#000000");
  const [lr, lg, lb] = hexToChannelValues(options.lightColor ?? "#FFFFFF");

  for (let y = 0; y < height; y++) {
    const modRow = Math.floor(y / scale) - margin;
    for (let x = 0; x < width; x++) {
      const modCol = Math.floor(x / scale) - margin;
      const inBounds =
        modRow >= 0 &&
        modRow < qr.modules.size &&
        modCol >= 0 &&
        modCol < qr.modules.size;
      const isDark = inBounds ? Boolean(qr.modules.get(modRow, modCol)) : false;
      const offset = (y * width + x) * 4;
      data[offset] = isDark ? dr : lr;
      data[offset + 1] = isDark ? dg : lg;
      data[offset + 2] = isDark ? db : lb;
      data[offset + 3] = 255;
    }
  }

  return { data, width, height, version: qr.version };
}

/**
 * Decodifica un código QR desde un buffer de píxeles RGBA usando jsQR (normal e invertido).
 */
export function decodeQRFromRGBA(
  rgbaData: Uint8ClampedArray,
  width: number,
  height: number
): DecodedQRResult | null {
  if (width <= 0 || height <= 0 || rgbaData.length !== width * height * 4) {
    return null;
  }
  const result = jsQR(rgbaData, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (!result) return null;

  return {
    content: result.data,
    version: result.version,
    corners: [
      result.location.topLeftCorner,
      result.location.topRightCorner,
      result.location.bottomRightCorner,
      result.location.bottomLeftCorner,
    ],
  };
}
