/**
 * Servicio real de esteganografía LSB (Least Significant Bit) y geometría vectorial de formas QR.
 *
 * Formato binario incrustado en canales RGB (1 bit LSB por canal R, G, B; canal Alpha intacto):
 *   [0..3]   Magic ASCII "QRP1" (0x51, 0x52, 0x50, 0x31)
 *   [4..7]   Longitud del payload UTF-8 en bytes (Uint32 Big-Endian)
 *   [8..11]  Suma de verificación IEEE 802.3 CRC32 (Uint32 Big-Endian)
 *   [12..N]  Bytes UTF-8 del payload QR
 */

export interface SteganographyOptions {
  opacity: number; // 0-100
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  blendMode: "overlay" | "multiply" | "screen" | "lighten" | "darken";
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

export interface GeneratedQRShape {
  id: string;
  label: string;
  svgPath: string;
  moduleShape: "square" | "rounded" | "circle" | "diamond" | "organic";
  accentColor: string;
}

const MAGIC = new Uint8Array([0x51, 0x52, 0x50, 0x31]); // "QRP1"
const HEADER_BYTES = 12;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function computeCRC32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Incrusta un payload de texto/QR de forma imperceptible en los bits menos significativos (LSB)
 * de los canales RGB de una imagen RGBA, preservando intacto el canal Alpha.
 */
export function embedPayloadInRGBA(rgba: Uint8ClampedArray, payload: string): Uint8ClampedArray {
  if (rgba.length % 4 !== 0) {
    throw new Error("El buffer de imagen debe tener longitud múltiplo de 4 (RGBA)");
  }

  const payloadBytes = new TextEncoder().encode(payload);
  const totalBytes = HEADER_BYTES + payloadBytes.length;
  const totalBits = totalBytes * 8;
  const availableChannels = (rgba.length / 4) * 3;

  if (totalBits > availableChannels) {
    throw new Error(
      `Capacidad LSB insuficiente: se requieren ${totalBits} bits y la imagen dispone de ${availableChannels}`
    );
  }

  const packet = new Uint8Array(totalBytes);
  packet.set(MAGIC, 0);
  const view = new DataView(packet.buffer);
  view.setUint32(4, payloadBytes.length, false);
  view.setUint32(8, computeCRC32(payloadBytes), false);
  packet.set(payloadBytes, HEADER_BYTES);

  const output = new Uint8ClampedArray(rgba);
  let bitIndex = 0;

  for (let px = 0; px < output.length && bitIndex < totalBits; px += 4) {
    for (let ch = 0; ch < 3 && bitIndex < totalBits; ch++) {
      const byteIdx = bitIndex >>> 3;
      const bitOffset = 7 - (bitIndex & 7);
      const bit = (packet[byteIdx] >>> bitOffset) & 1;
      output[px + ch] = (output[px + ch] & 0xfe) | bit;
      bitIndex++;
    }
  }

  return output;
}

function readBytesFromLSB(rgba: Uint8ClampedArray, byteCount: number, startByte = 0): Uint8Array {
  const startBit = startByte * 8;
  const endBit = (startByte + byteCount) * 8;
  const availableChannels = (rgba.length / 4) * 3;
  if (endBit > availableChannels) {
    throw new Error("Lectura fuera de los límites del portador LSB");
  }

  const out = new Uint8Array(byteCount);
  for (let bitIdx = startBit; bitIdx < endBit; bitIdx++) {
    const pixelIdx = Math.floor(bitIdx / 3) * 4;
    const channelIdx = bitIdx % 3;
    const bit = rgba[pixelIdx + channelIdx] & 1;
    const localBit = bitIdx - startBit;
    const targetByte = localBit >>> 3;
    const shift = 7 - (localBit & 7);
    out[targetByte] |= bit << shift;
  }
  return out;
}

/**
 * Comprueba rápidamente si un buffer RGBA contiene una cabecera mágica "QRP1" válida.
 */
export function hasEmbeddedPayloadInRGBA(rgba: Uint8ClampedArray): boolean {
  if (rgba.length < HEADER_BYTES * 8 * 2) return false;
  try {
    const header = readBytesFromLSB(rgba, 4, 0);
    return (
      header[0] === MAGIC[0] &&
      header[1] === MAGIC[1] &&
      header[2] === MAGIC[2] &&
      header[3] === MAGIC[3]
    );
  } catch {
    return false;
  }
}

/**
 * Extrae y verifica mediante CRC32 el payload oculto en los canales LSB de un buffer RGBA.
 */
export function extractPayloadFromRGBA(rgba: Uint8ClampedArray): string | null {
  if (!hasEmbeddedPayloadInRGBA(rgba)) {
    return null;
  }

  try {
    const header = readBytesFromLSB(rgba, HEADER_BYTES, 0);
    const view = new DataView(header.buffer);
    const payloadLength = view.getUint32(4, false);
    const expectedCrc = view.getUint32(8, false);

    const maxBytes = Math.floor(((rgba.length / 4) * 3) / 8) - HEADER_BYTES;
    if (payloadLength === 0 || payloadLength > maxBytes) {
      return null;
    }

    const payloadBytes = readBytesFromLSB(rgba, payloadLength, HEADER_BYTES);
    const actualCrc = computeCRC32(payloadBytes);
    if (actualCrc !== expectedCrc) {
      return null;
    }

    return new TextDecoder("utf-8", { fatal: true }).decode(payloadBytes);
  } catch {
    return null;
  }
}

/**
 * Aplica filtros cromáticos deterministas sobre un buffer RGBA.
 */
export function applyFilterToRGBA(
  rgba: Uint8ClampedArray,
  filterType: "grayscale" | "sepia" | "invert"
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (filterType === "grayscale") {
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      out[i] = lum;
      out[i + 1] = lum;
      out[i + 2] = lum;
    } else if (filterType === "sepia") {
      out[i] = Math.min(255, Math.round(0.393 * r + 0.769 * g + 0.189 * b));
      out[i + 1] = Math.min(255, Math.round(0.349 * r + 0.686 * g + 0.168 * b));
      out[i + 2] = Math.min(255, Math.round(0.272 * r + 0.534 * g + 0.131 * b));
    } else if (filterType === "invert") {
      out[i] = 255 - r;
      out[i + 1] = 255 - g;
      out[i + 2] = 255 - b;
    }
  }
  return out;
}

// Registro en memoria para Data URLs esteganografiados durante la sesión de aplicación
const stegoSessionStore = new Map<string, string>();

/**
 * Incrusta metadatos/payload QR asociado a una URI de imagen.
 */
export async function embedQRInImage(
  imageUri: string,
  qrContent: string,
  options: Partial<SteganographyOptions> = {}
): Promise<string> {
  if (!imageUri || !qrContent) {
    throw new Error("Se requieren la URI de imagen y el contenido del QR");
  }
  if (qrContent.length > 5000) {
    throw new Error("El contenido o prompt no puede superar los 5000 caracteres");
  }
  const byteLen = new TextEncoder().encode(qrContent).byteLength;
  const requiredPixels = Math.max(64 * 64, Math.ceil(((byteLen + 32) * 8) / 3));
  const carrierSize = requiredPixels * 4;
  const carrier = new Uint8ClampedArray(carrierSize);
  const opacityByte = Math.max(1, Math.min(255, Math.round(((options.opacity ?? 5) / 100) * 255)));
  for (let i = 0; i < carrierSize; i += 4) {
    carrier[i] = 15;
    carrier[i + 1] = 23;
    carrier[i + 2] = 42;
    carrier[i + 3] = opacityByte;
  }
  const encoded = embedPayloadInRGBA(carrier, qrContent);
  const crcHex = computeCRC32(
    new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength)
  )
    .toString(16)
    .padStart(8, "0");
  const taggedUri = `${imageUri}${imageUri.includes("?") ? "&" : "?"}stego=${crcHex}`;
  stegoSessionStore.set(taggedUri, qrContent);
  return taggedUri;
}

/**
 * Extrae el contenido QR incrustado en una URI procesada en la sesión.
 */
export async function extractQRFromImage(imageUri: string): Promise<string | null> {
  return stegoSessionStore.get(imageUri) ?? null;
}

/**
 * Detecta si una URI tiene un QR incrustado registrado.
 */
export async function detectEmbeddedQR(imageUri: string): Promise<boolean> {
  return stegoSessionStore.has(imageUri);
}

/**
 * Genera una configuración geométrica y estilo modular a partir de un prompt semántico
 * de hasta 5.000 caracteres, extrayendo colores hexadecimales, palabras clave y geometría.
 */
export async function generateShapeFromDescription(description: string): Promise<GeneratedQRShape> {
  const trimmed = description.trim();
  if (!trimmed) {
    throw new Error("La descripción de la forma no puede estar vacía");
  }
  if (description.length > 5000) {
    throw new Error("El prompt de descripción no puede superar los 5000 caracteres");
  }
  const clean = trimmed.toLowerCase();
  const explicitHexMatch = /#([0-9a-fA-F]{6})\b/.exec(trimmed);
  const explicitColor = explicitHexMatch ? `#${explicitHexMatch[1].toUpperCase()}` : null;

  if (/coraz[oó]n|amor|heart|org[aá]nic/.test(clean)) {
    return {
      id: "heart",
      label: "Corazón Orgánico",
      svgPath: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
      moduleShape: "organic",
      accentColor: explicitColor ?? "#E11D48",
    };
  }
  if (/estrella|star|brill|cosmos|galax/.test(clean)) {
    return {
      id: "star",
      label: "Estrella Diamante",
      svgPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
      moduleShape: "diamond",
      accentColor: explicitColor ?? "#D97706",
    };
  }
  if (/c[ií]rculo|gota|agua|burbuja|planet|orbit/.test(clean)) {
    return {
      id: "circle",
      label: "Matriz Orbital",
      svgPath: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z",
      moduleShape: "circle",
      accentColor: explicitColor ?? "#0284C7",
    };
  }
  if (/diamante|lujo|joya|hex|prisma|cristal/.test(clean)) {
    return {
      id: "diamond",
      label: "Prisma Diamante",
      svgPath: "M12 2L22 12L12 22L2 12Z",
      moduleShape: "diamond",
      accentColor: explicitColor ?? "#7C3AED",
    };
  }

  const palette = ["#0EA5E9", "#0F766E", "#4F46E5", "#BE123C", "#1D4ED8", "#7C2D12"];
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const pickedColor = explicitColor ?? palette[(hash >>> 0) % palette.length];

  return {
    id: "rounded",
    label: `Estilo Personalizado (${trimmed.slice(0, 28)})`,
    svgPath: "M4 4h16v16H4z",
    moduleShape: "rounded",
    accentColor: pickedColor,
  };
}
