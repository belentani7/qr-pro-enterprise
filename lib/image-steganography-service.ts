import * as FileSystem from "expo-file-system/legacy";
// ImageManipulator está incluido en Expo SDK 54

/**
 * Servicio de esteganografía para incrustar QR invisible en imágenes
 * Utiliza técnica LSB (Least Significant Bit) para máxima invisibilidad
 */

export interface SteganographyOptions {
  opacity: number; // 0-100, donde 0 es invisible
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  blendMode: "overlay" | "multiply" | "screen" | "lighten" | "darken";
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number; // 0-100
  format?: "jpeg" | "png" | "webp";
}

/**
 * Generar QR invisible en imagen usando esteganografía LSB
 */
export async function embedQRInImage(
  imagePath: string,
  qrDataUrl: string,
  options: Partial<SteganographyOptions> = {}
): Promise<string> {
  try {
    const finalOptions: SteganographyOptions = {
      opacity: options.opacity ?? 5, // Muy bajo para invisibilidad
      position: options.position ?? "center",
      blendMode: options.blendMode ?? "overlay",
    };

    // Obtener información de la imagen
    const imageInfo = await FileSystem.getInfoAsync(imagePath);
    if (!imageInfo.exists) {
      throw new Error("Imagen no encontrada");
    }

    // Aquí iría la lógica de esteganografía LSB real
    // Por ahora, retornamos la ruta de la imagen original
    return imagePath;
  } catch (error) {
    console.error("Error embedding QR in image:", error);
    throw error;
  }
}

/**
 * Extraer QR invisible desde imagen
 */
export async function extractQRFromImage(imagePath: string): Promise<string | null> {
  try {
    // Validar que la imagen existe
    const imageInfo = await FileSystem.getInfoAsync(imagePath);
    if (!imageInfo.exists) {
      throw new Error("Imagen no encontrada");
    }

    // Aquí iría la lógica de extracción LSB real
    // Por ahora, retornamos null
    return null;
  } catch (error) {
    console.error("Error extracting QR from image:", error);
    return null;
  }
}

/**
 * Procesar imagen para optimizar para esteganografía
 */
export async function optimizeImageForSteganography(
  imagePath: string,
  options: ImageProcessingOptions = {}
): Promise<string> {
  try {
    const finalOptions: ImageProcessingOptions = {
      width: options.width ?? 1024,
      height: options.height ?? 1024,
      quality: options.quality ?? 90,
      format: options.format ?? "png",
    };

    // Validar que la imagen existe
    const imageInfo = await FileSystem.getInfoAsync(imagePath);
    if (!imageInfo.exists) {
      throw new Error("Imagen no encontrada");
    }

    return imagePath;
  } catch (error) {
    console.error("Error optimizing image:", error);
    throw error;
  }
}

/**
 * Aplicar filtro a imagen
 */
export async function applyFilterToImage(
  imagePath: string,
  filterType: "grayscale" | "sepia" | "invert" | "blur"
): Promise<string> {
  try {
    // Validar que la imagen existe
    const imageInfo = await FileSystem.getInfoAsync(imagePath);
    if (!imageInfo.exists) {
      throw new Error("Imagen no encontrada");
    }

    // Aquí iría la lógica de filtros real
    // Por ahora, retornamos la imagen original
    return imagePath;
  } catch (error) {
    console.error("Error applying filter:", error);
    throw error;
  }
}

/**
 * Detectar si una imagen tiene QR incrustado
 */
export async function detectEmbeddedQR(imagePath: string): Promise<boolean> {
  try {
    // Validar que la imagen existe
    const imageInfo = await FileSystem.getInfoAsync(imagePath);
    if (!imageInfo.exists) {
      return false;
    }

    // Aquí iría la lógica de detección real
    // Por ahora, retornamos false
    return false;
  } catch (error) {
    console.error("Error detecting embedded QR:", error);
    return false;
  }
}

/**
 * Calcular estadísticas de imagen para análisis
 */
export async function analyzeImage(imagePath: string): Promise<{
  width: number;
  height: number;
  size: number;
  format: string;
  hasAlpha: boolean;
}> {
  try {
    const imageInfo = await FileSystem.getInfoAsync(imagePath);
    if (!imageInfo.exists) {
      throw new Error("Imagen no encontrada");
    }

    // Obtener información básica
    const size = imageInfo.size || 0;

    return {
      width: 1024, // Valor por defecto
      height: 1024, // Valor por defecto
      size,
      format: imagePath.endsWith(".png") ? "png" : "jpeg",
      hasAlpha: imagePath.endsWith(".png"),
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

/**
 * Generar forma personalizada basada en descripción
 */
export async function generateShapeFromDescription(
  description: string
): Promise<string> {
  try {
    // Mapeo de descripciones a formas SVG
    const shapeMap: { [key: string]: string } = {
      perro: generateDogShape(),
      gato: generateCatShape(),
      corazón: generateHeartShape(),
      estrella: generateStarShape(),
      círculo: generateCircleShape(),
      cuadrado: generateSquareShape(),
      triángulo: generateTriangleShape(),
      diamante: generateDiamondShape(),
      flor: generateFlowerShape(),
      árbol: generateTreeShape(),
    };

    // Buscar forma coincidente
    const lowerDesc = description.toLowerCase();
    for (const [key, shape] of Object.entries(shapeMap)) {
      if (lowerDesc.includes(key)) {
        return shape;
      }
    }

    // Si no hay coincidencia, retornar forma genérica
    return generateCircleShape();
  } catch (error) {
    console.error("Error generating shape:", error);
    throw error;
  }
}

// Funciones auxiliares para generar formas SVG

function generateDogShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="40" r="20" fill="black"/>
      <circle cx="35" cy="30" r="8" fill="black"/>
      <circle cx="65" cy="30" r="8" fill="black"/>
      <ellipse cx="50" cy="70" rx="15" ry="20" fill="black"/>
      <rect x="40" y="85" width="5" height="10" fill="black"/>
      <rect x="55" y="85" width="5" height="10" fill="black"/>
    </svg>
  `;
}

function generateCatShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="45" r="25" fill="black"/>
      <polygon points="30,15 50,5 70,15" fill="black"/>
      <circle cx="40" cy="40" r="4" fill="white"/>
      <circle cx="60" cy="40" r="4" fill="white"/>
      <polygon points="50,50 45,55 55,55" fill="black"/>
    </svg>
  `;
}

function generateHeartShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,85 C20,65 10,50 10,35 C10,20 20,10 30,10 C40,10 50,20 50,20 C50,20 60,10 70,10 C80,10 90,20 90,35 C90,50 80,65 50,85 Z" fill="black"/>
    </svg>
  `;
}

function generateStarShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 61,40 92,40 67,60 78,90 50,70 22,90 33,60 8,40 39,40" fill="black"/>
    </svg>
  `;
}

function generateCircleShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="black"/>
    </svg>
  `;
}

function generateSquareShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="60" height="60" fill="black"/>
    </svg>
  `;
}

function generateTriangleShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 90,80 10,80" fill="black"/>
    </svg>
  `;
}

function generateDiamondShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 90,50 50,90 10,50" fill="black"/>
    </svg>
  `;
}

function generateFlowerShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="15" fill="black"/>
      <circle cx="50" cy="20" r="12" fill="black"/>
      <circle cx="80" cy="50" r="12" fill="black"/>
      <circle cx="50" cy="80" r="12" fill="black"/>
      <circle cx="20" cy="50" r="12" fill="black"/>
    </svg>
  `;
}

function generateTreeShape(): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 70,40 80,40 50,70 20,40 30,40" fill="black"/>
      <rect x="45" y="70" width="10" height="25" fill="black"/>
    </svg>
  `;
}
