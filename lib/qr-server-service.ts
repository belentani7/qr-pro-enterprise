/**
 * Servicio para generar QR usando QR Server API (gratuito)
 * API: https://qr-server.com/
 */

export interface QROptions {
  size?: number; // 100-1000 (default: 300)
  darkColor?: string; // Hex color sin # (default: 000000)
  lightColor?: string; // Hex color sin # (default: FFFFFF)
  margin?: number; // 0-50 (default: 0)
  format?: "png" | "jpg" | "svg"; // (default: png)
}

export interface QRWithLogoOptions extends QROptions {
  logoUrl?: string; // URL de imagen para logo en centro
  logoSize?: number; // 10-50 (porcentaje del QR)
}

/**
 * Generar QR simple usando QR Server
 */
export function generateQRUrl(content: string, options: QROptions = {}): string {
  const size = options.size || 300;
  const darkColor = options.darkColor || "000000";
  const lightColor = options.lightColor || "FFFFFF";
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
 * Generar QR con logo (requiere procesamiento adicional)
 */
export async function generateQRWithLogo(
  content: string,
  logoUrl: string,
  options: QRWithLogoOptions = {}
): Promise<string> {
  try {
    const size = options.size || 300;
    const darkColor = options.darkColor || "000000";
    const lightColor = options.lightColor || "FFFFFF";
    const margin = options.margin || 0;
    const logoSize = options.logoSize || 20;

    // Generar QR base
    const qrUrl = generateQRUrl(content, {
      size,
      darkColor,
      lightColor,
      margin,
      format: "png",
    });

    // Aquí iría la lógica para superponer el logo
    // Por ahora retornamos el QR sin logo
    return qrUrl;
  } catch (error) {
    console.error("Error generating QR with logo:", error);
    throw error;
  }
}

/**
 * Obtener URL de descarga del QR
 */
export function getQRDownloadUrl(content: string, options: QROptions = {}): string {
  return generateQRUrl(content, options);
}

/**
 * Validar que el contenido sea válido
 */
export function validateQRContent(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }
  if (content.length > 2953) {
    // Límite de QR
    return false;
  }
  return true;
}

/**
 * Convertir color hex a RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convertir RGB a hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

/**
 * Presets de colores populares
 */
export const COLOR_PRESETS = {
  classic: { dark: "000000", light: "FFFFFF" },
  blue: { dark: "0066CC", light: "FFFFFF" },
  red: { dark: "CC0000", light: "FFFFFF" },
  green: { dark: "00AA00", light: "FFFFFF" },
  purple: { dark: "6600CC", light: "FFFFFF" },
  orange: { dark: "FF6600", light: "FFFFFF" },
  dark: { dark: "1A1A1A", light: "EEEEEE" },
  neon: { dark: "00FF00", light: "000000" },
};

/**
 * Presets de tamaños
 */
export const SIZE_PRESETS = {
  small: 150,
  medium: 300,
  large: 500,
  xlarge: 800,
};
