import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Servicio de seguridad y privacidad para cumplimiento GDPR/RGPD
 * Datos locales, sumas de comprobación no criptográficas y consentimiento.
 * No implementa cifrado autenticado ni marcas de agua reales.
 */

export interface SecurityPolicy {
  gdprConsent: boolean;
  dataCollectionConsent: boolean;
  analyticsConsent: boolean;
  lastConsentDate: string;
  version: string;
}

export interface QRMetadata {
  id: string;
  hash: string;
  timestamp: number;
  encrypted: boolean;
  watermark: string;
}

const CONSENT_STORAGE_KEY = "@qr_pro_consent";
const QR_STORAGE_KEYS = new Set(["qr_history", "qr_favorites"]);
const ownsQRStorageKey = (key: string): boolean =>
  key.startsWith("@qr_pro") || QR_STORAGE_KEYS.has(key);

/**
 * Inicializar política de seguridad
 */
export async function initializeSecurityPolicy(): Promise<SecurityPolicy> {
  try {
    const existing = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    if (existing) {
      return JSON.parse(existing);
    }

    const policy: SecurityPolicy = {
      gdprConsent: false,
      dataCollectionConsent: false,
      analyticsConsent: false,
      lastConsentDate: new Date().toISOString(),
      version: "1.0",
    };

    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(policy));
    return policy;
  } catch (error) {
    console.error("Error initializing security policy:", error);
    throw error;
  }
}

/**
 * Obtener política de seguridad actual
 */
export async function getSecurityPolicy(): Promise<SecurityPolicy | null> {
  try {
    const policy = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    return policy ? JSON.parse(policy) : null;
  } catch (error) {
    console.error("Error getting security policy:", error);
    return null;
  }
}

/**
 * Actualizar consentimiento GDPR
 */
export async function updateGDPRConsent(consent: boolean): Promise<void> {
  try {
    const policy = (await getSecurityPolicy()) || (await initializeSecurityPolicy());
    policy.gdprConsent = consent;
    policy.lastConsentDate = new Date().toISOString();
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(policy));
  } catch (error) {
    console.error("Error updating GDPR consent:", error);
    throw error;
  }
}

/**
 * Calcular una suma de comprobación estable; no prueba originalidad ni autoría.
 */
export async function generateQRHash(content: string): Promise<string> {
  try {
    // Stable FNV-1a checksum. This detects accidental content changes only:
    // it is NOT encryption, authentication or tamper-resistant proof.
    let hash = 0x811c9dc5;
    for (let i = 0; i < content.length; i++) {
      hash ^= content.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return "fnv1a32:" + hash.toString(16).padStart(8, "0");
  } catch (error) {
    console.error("Error generating QR hash:", error);
    throw error;
  }
}

/**
 * Generar únicamente una etiqueta de metadatos, NO una marca incrustada.
 */
export async function generateWatermark(): Promise<string> {
  try {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    // Non-secret metadata label only; no pixel-level watermark is applied.
    return `${timestamp}-${random}`;
  } catch (error) {
    console.error("Error generating watermark:", error);
    throw error;
  }
}

/**
 * Crear metadatos de QR sin afirmar cifrado ni integridad autenticada.
 */
export async function createQRMetadata(content: string): Promise<QRMetadata> {
  const hash = await generateQRHash(content);
  const watermark = await generateWatermark();

  return {
    id: `qr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    hash,
    timestamp: Date.now(),
    encrypted: false, // QR content is not encrypted by this module.
    watermark,
  };
}

/** Explicitly refuse fake encryption until real, audited crypto is available. */
export async function encryptData(data: unknown): Promise<string> {
  void data;
  throw new Error("Encriptación de contenido no disponible. No se han cifrado los datos.");
}

/**
 * Derecho al olvido: eliminar todos los datos del usuario
 */
export async function deleteAllUserData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const qrProKeys = keys.filter(ownsQRStorageKey);
    await AsyncStorage.multiRemove(qrProKeys);
    // Includes qr_history and qr_favorites, not only consent preferences.
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
}

/**
 * Obtener resumen de datos recopilados
 */
export async function getDataSummary(): Promise<{
  totalQRGenerated: number;
  totalQRScanned: number;
  storageSize: string;
  lastModified: string;
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const qrProKeys = keys.filter(ownsQRStorageKey);

    let totalSize = 0;
    for (const key of qrProKeys) {
      const item = await AsyncStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    }

    const storageSizeKB = (totalSize / 1024).toFixed(2);

    // Count the same history the user sees in the app. Do not make up zero
    // counts when actual stored records exist.
    let history: Array<{ type?: unknown; timestamp?: unknown }> = [];
    try {
      const raw = await AsyncStorage.getItem("qr_history");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          history = parsed.filter((entry): entry is { type?: unknown; timestamp?: unknown } =>
            typeof entry === "object" && entry !== null && !Array.isArray(entry));
        }
      }
    } catch {
      // Corrupt history should not prevent display of data size and controls.
    }
    const timestamps = history
      .map(item => item.timestamp)
      .filter((value): value is number =>
        typeof value === "number" && Number.isFinite(value) && value > 0 && value <= Date.now());
    return {
      totalQRGenerated: history.filter(item => item.type === "generated").length,
      totalQRScanned: history.filter(item => item.type === "scanned").length,
      storageSize: `${storageSizeKB} KB`,
      lastModified: timestamps.length
        ? new Date(timestamps.reduce((max, next) => Math.max(max, next), 0)).toISOString()
        : "Sin historial",
    };
  } catch (error) {
    console.error("Error getting data summary:", error);
    throw error;
  }
}

/**
 * Validar integridad de QR
 */
export async function validateQRIntegrity(content: string, hash: string): Promise<boolean> {
  try {
    const newHash = await generateQRHash(content);
    return newHash === hash;
  } catch (error) {
    console.error("Error validating QR integrity:", error);
    return false;
  }
}

/**
 * Generar reporte de seguridad
 */
export async function generateSecurityReport(): Promise<string> {
  try {
    const policy = await getSecurityPolicy();
    const summary = await getDataSummary();

    const report = `
=== REPORTE DE SEGURIDAD Y PRIVACIDAD ===
Fecha: ${new Date().toISOString()}

PREFERENCIAS LOCALES DE PRIVACIDAD (NO CERTIFICACIÓN RGPD):
- Consentimiento GDPR: ${policy?.gdprConsent ? "✓ Aceptado" : "✗ Rechazado"}
- Recopilación de Datos: ${policy?.dataCollectionConsent ? "✓ Aceptado" : "✗ Rechazado"}
- Analytics: ${policy?.analyticsConsent ? "✓ Aceptado" : "✗ Rechazado"}
- Última actualización: ${policy?.lastConsentDate}

DATOS DEL USUARIO:
- QR Generados: ${summary.totalQRGenerated}
- QR Escaneados: ${summary.totalQRScanned}
- Tamaño de Almacenamiento: ${summary.storageSize}

PROTECCIÓN:
- Cifrado del contenido QR por esta aplicación: NO IMPLEMENTADO
- Suma de comprobación local: disponible; no prueba autenticidad
- Marca de agua invisible dentro de imágenes: NO IMPLEMENTADA
- TLS: depende del alojamiento y del proveedor de conexión

DERECHOS DEL USUARIO:
- Derecho al Olvido: Disponible
- Portabilidad de Datos: Disponible
- Acceso a Datos: Disponible
- Rectificación: Disponible
    `;

    return report;
  } catch (error) {
    console.error("Error generating security report:", error);
    throw error;
  }
}
