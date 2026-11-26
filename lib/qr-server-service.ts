import {
  generateLocalQRPngDataUrl,
  generateLocalQRSVG,
  isValidQRPayload,
  svgToDataUrl,
  type QRErrorCorrectionLevel,
} from "./qr-engine";

/**
 * Servicio de generación QR con soporte híbrido:
 * - Generación 100 % local (SVG / PNG Data URL) sin envío de datos a terceros (recomendado).
 * - Generación de URL remota compatible con QR Server API cuando se requiere enlace HTTP externo.
 */

export interface QROptions {
  size?: number; // 100-1000 (default: 300)
  darkColor?: string; // Hex color sin # (default: 000000)
  lightColor?: string; // Hex color sin # (default: FFFFFF)
  margin?: number; // 0-50 (default: 0)
  format?: "png" | "jpg" | "svg"; // (default: png)
  errorCorrectionLevel?: QRErrorCorrectionLevel;
}

export interface QRWithLogoOptions extends QROptions {
  logoUrl?: string;
  logoText?: string;
  logoSize?: number; // 10-30 (porcentaje del QR)
}

/**
 * Construye una URL hacia QR Server API (servicio externo de terceros).
 * Nota de privacidad: para datos sensibles utilice `generateLocalQRDataUrl`.
 */
export function generateQRUrl(content: string, options: QROptions = {}): string {
  const size = options.size || 300;
  const darkColor = (options.darkColor || "000000").replace(/^#/, "");
  const lightColor = (options.lightColor || "FFFFFF").replace(/^#/, "");
  const margin = options.margin || 0;
  const format = options.format || "png";

  const encodedContent = encodeURIComponent(content);

  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedContent}&color=${darkColor}&bgcolor=${lightColor}&margin=${margin}&format=${format}`;
}

export function generateQRBackupUrl(content: string, options: QROptions = {}): string {
  const size = options.size || 300;
  const encodedContent = encodeURIComponent(content);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedContent}`;
}

/**
 * Genera un QR 100 % local en el dispositivo (PNG o SVG Data URL) sin tráfico externo.
 */
export async function generateLocalQRDataUrl(
  content: string,
  options: QROptions = {}
): Promise<string> {
  const darkColor = `#${(options.darkColor || "000000").replace(/^#/, "")}`;
  const lightColor = `#${(options.lightColor || "FFFFFF").replace(/^#/, "")}`;
  const width = options.size || 300;
  const margin = options.margin ?? 2;

  if (options.format === "svg") {
    const svg = generateLocalQRSVG(content, {
      width,
      margin,
      darkColor,
      lightColor,
      errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
    });
    return svgToDataUrl(svg);
  }

  return generateLocalQRPngDataUrl(content, {
    width,
    margin,
    darkColor,
    lightColor,
    errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
  });
}

/**
 * Genera un QR vectorial local con emblema/logo central y corrección Reed-Solomon nivel H (30 %).
 */
export async function generateQRWithLogo(
  content: string,
  logoLabelOrUrl: string,
  options: QRWithLogoOptions = {}
): Promise<string> {
  const size = options.size || 300;
  const darkColor = `#${(options.darkColor || "000000").replace(/^#/, "")}`;
  const lightColor = `#${(options.lightColor || "FFFFFF").replace(/^#/, "")}`;
  const margin = options.margin ?? 2;
  const derivedLabel =
    options.logoText ||
    logoLabelOrUrl
      .replace(/^https?:\/\//i, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase() ||
    "QR";

  const svg = generateLocalQRSVG(content, {
    width: size,
    margin,
    darkColor,
    lightColor,
    errorCorrectionLevel: "H",
    moduleShape: "rounded",
    finderStyle: "rounded",
    logoText: derivedLabel,
  });

  return svgToDataUrl(svg);
}

/**
 * Obtiene URL de descarga del QR.
 */
export function getQRDownloadUrl(content: string, options: QROptions = {}): string {
  return generateQRUrl(content, options);
}

/**
 * Valida que el contenido cumpla con los límites de capacidad de un código QR estándar.
 */
export function validateQRContent(content: string): boolean {
  return isValidQRPayload(content);
}

/**
 * Convierte color hexadecimal (con o sin #) a componentes RGB.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.trim().replace(/^#/, "");
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleaned);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convierte componentes RGB (0-255) a hexadecimal de 6 caracteres.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b]
    .map((x) => {
      const clamped = Math.max(0, Math.min(255, Math.round(x)));
      const hex = clamped.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");
}

/**
 * Presets de colores con contraste verificado.
 */
export const COLOR_PRESETS = {
  classic: { dark: "000000", light: "FFFFFF", label: "Clásico" },
  blue: { dark: "0052A3", light: "FFFFFF", label: "Azul Corporativo" },
  red: { dark: "B91C1C", light: "FFFFFF", label: "Carmesí" },
  green: { dark: "047857", light: "FFFFFF", label: "Esmeralda" },
  purple: { dark: "5B21B6", light: "FFFFFF", label: "Violeta" },
  orange: { dark: "C2410C", light: "FFFFFF", label: "Ámbar Oscuro" },
  dark: { dark: "0F172A", light: "F8FAFC", label: "Pizarra" },
  cyan: { dark: "0E7490", light: "F0FDFA", label: "Cian Enterprise" },
} as const;

/**
 * Presets de tamaños en píxeles.
 */
export const SIZE_PRESETS = {
  small: 180,
  medium: 320,
  large: 512,
  xlarge: 1024,
} as const;
