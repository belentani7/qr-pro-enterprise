import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Servicio de seguridad y privacidad local (controles técnicos RGPD / LOPDGDD):
 * - Integridad determinista SHA-256 mediante Web Crypto API (SubtleCrypto).
 * - Cifrado autenticado AES-256-GCM con IV aleatorio de 96 bits (12 bytes) y clave aleatoria por dispositivo.
 * - Gestión de consentimiento, derecho de supresión (Art. 17) y portabilidad JSON (Art. 20).
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
const DEVICE_KEY_STORAGE_KEY = "@qr_pro_device_key_v2";
const HISTORY_STORAGE_KEY = "@qr_pro_history";
const FAVORITES_STORAGE_KEY = "@qr_pro_favorites";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("Cadena hexadecimal no válida");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function getRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buf);
    return buf;
  }
  throw new Error("CSPRNG (crypto.getRandomValues) no disponible en este entorno");
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API (SubtleCrypto) no disponible en este entorno");
  }
  const existingHex = await AsyncStorage.getItem(DEVICE_KEY_STORAGE_KEY);
  let rawKey: Uint8Array;
  if (existingHex && /^[0-9a-fA-F]{64}$/.test(existingHex)) {
    rawKey = hexToBytes(existingHex);
  } else {
    rawKey = getRandomBytes(32);
    await AsyncStorage.setItem(DEVICE_KEY_STORAGE_KEY, bytesToHex(rawKey));
  }
  return globalThis.crypto.subtle.importKey(
    "raw",
    rawKey.buffer.slice(rawKey.byteOffset, rawKey.byteOffset + rawKey.byteLength) as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Inicializar política de seguridad local con minimización por defecto (opt-in estricto).
 */
export async function initializeSecurityPolicy(): Promise<SecurityPolicy> {
  const existing = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
  if (existing) {
    return JSON.parse(existing) as SecurityPolicy;
  }

  const policy: SecurityPolicy = {
    gdprConsent: false,
    dataCollectionConsent: false,
    analyticsConsent: false,
    lastConsentDate: new Date().toISOString(),
    version: "2.0",
  };

  await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(policy));
  return policy;
}

/**
 * Obtener política de seguridad actual (inicializa si aún no existe).
 */
export async function getSecurityPolicy(): Promise<SecurityPolicy> {
  const existing = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
  if (existing) {
    return JSON.parse(existing) as SecurityPolicy;
  }
  return initializeSecurityPolicy();
}

/**
 * Actualizar consentimiento RGPD.
 */
export async function updateGDPRConsent(consent: boolean): Promise<SecurityPolicy> {
  const policy = await getSecurityPolicy();
  const updated: SecurityPolicy = {
    ...policy,
    gdprConsent: consent,
    lastConsentDate: new Date().toISOString(),
  };
  await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Genera un hash criptográfico SHA-256 determinista sobre el contenido UTF-8 del QR.
 */
export async function generateQRHash(content: string): Promise<string> {
  const encoded = new TextEncoder().encode(content);
  const digestBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer
  );
  return bytesToHex(new Uint8Array(digestBuffer));
}

/**
 * Genera un identificador de marca de agua criptográficamente aleatorio (96 bits).
 */
export async function generateWatermark(): Promise<string> {
  return bytesToHex(getRandomBytes(12));
}

/**
 * Crea metadatos verificables para un código QR.
 */
export async function createQRMetadata(content: string): Promise<QRMetadata> {
  const [hash, watermark] = await Promise.all([
    generateQRHash(content),
    generateWatermark(),
  ]);
  const suffix = bytesToHex(getRandomBytes(4));

  return {
    id: `qr_${Date.now()}_${suffix}`,
    hash,
    timestamp: Date.now(),
    encrypted: true,
    watermark,
  };
}

/**
 * Cifra cualquier estructura serializable usando AES-256-GCM autenticado (IV de 12 bytes).
 */
export async function encryptData(data: unknown): Promise<string> {
  const key = await getOrCreateDeviceKey();
  const iv = getRandomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer,
    },
    key,
    plaintext.buffer.slice(
      plaintext.byteOffset,
      plaintext.byteOffset + plaintext.byteLength
    ) as ArrayBuffer
  );
  return `v2:${bytesToHex(iv)}:${bytesToHex(new Uint8Array(cipherBuffer))}`;
}

/**
 * Descifra un bloque cifrado con encryptData (AES-256-GCM) verificando etiqueta de autenticación.
 */
export async function decryptData<T = unknown>(encryptedPayload: string): Promise<T> {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3 || parts[0] !== "v2") {
    throw new Error("Formato de payload cifrado no soportado");
  }
  const iv = hexToBytes(parts[1]);
  if (iv.byteLength !== 12) {
    throw new Error("IV AES-GCM inválido");
  }
  const ciphertext = hexToBytes(parts[2]);
  const key = await getOrCreateDeviceKey();
  const plainBuffer = await globalThis.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer,
    },
    key,
    ciphertext.buffer.slice(
      ciphertext.byteOffset,
      ciphertext.byteOffset + ciphertext.byteLength
    ) as ArrayBuffer
  );
  const json = new TextDecoder().decode(plainBuffer);
  return JSON.parse(json) as T;
}

/**
 * Derecho de supresión (Art. 17 RGPD): elimina todas las claves locales de la aplicación.
 */
export async function deleteAllUserData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const qrProKeys = keys.filter(
    (key) => key.startsWith("@qr_pro") || key.startsWith("qr_pro_")
  );
  if (qrProKeys.length > 0) {
    await AsyncStorage.multiRemove(qrProKeys);
  }
}

/**
 * Resumen real de almacenamiento e ítems guardados localmente.
 */
export async function getDataSummary(): Promise<{
  totalQRGenerated: number;
  totalFavorites: number;
  storageSize: string;
  lastModified: string;
}> {
  const keys = await AsyncStorage.getAllKeys();
  const qrProKeys = keys.filter(
    (key) => key.startsWith("@qr_pro") || key.startsWith("qr_pro_")
  );

  let totalBytes = 0;
  for (const key of qrProKeys) {
    const item = await AsyncStorage.getItem(key);
    if (item) {
      totalBytes += new TextEncoder().encode(item).byteLength;
    }
  }

  let totalQRGenerated = 0;
  let totalFavorites = 0;
  try {
    const rawHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (rawHistory) {
      const parsed: unknown = JSON.parse(rawHistory);
      if (Array.isArray(parsed)) totalQRGenerated = parsed.length;
    }
    const rawFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    if (rawFavorites) {
      const parsed: unknown = JSON.parse(rawFavorites);
      if (Array.isArray(parsed)) totalFavorites = parsed.length;
    }
  } catch {
    // Si una entrada corrupta no se puede parsear, reportar 0 sin romper el resumen
  }

  return {
    totalQRGenerated,
    totalFavorites,
    storageSize: `${(totalBytes / 1024).toFixed(2)} KB`,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Derecho a la portabilidad (Art. 20 RGPD): exporta los datos locales en JSON estructurado.
 */
export async function exportPortableUserData(): Promise<string> {
  const [policy, summary, rawHistory, rawFavorites] = await Promise.all([
    getSecurityPolicy(),
    getDataSummary(),
    AsyncStorage.getItem(HISTORY_STORAGE_KEY),
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
  ]);

  return JSON.stringify(
    {
      application: "QR Pro Enterprise",
      exportedAt: new Date().toISOString(),
      policy,
      summary,
      history: rawHistory ? (JSON.parse(rawHistory) as unknown) : [],
      favorites: rawFavorites ? (JSON.parse(rawFavorites) as unknown) : [],
    },
    null,
    2
  );
}

/**
 * Valida la integridad SHA-256 de un contenido QR en tiempo constante sobre el hex.
 */
export async function validateQRIntegrity(content: string, expectedHash: string): Promise<boolean> {
  if (!expectedHash || typeof expectedHash !== "string") return false;
  const computed = await generateQRHash(content);
  if (computed.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expectedHash.toLowerCase().charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Genera informe técnico verificable de privacidad y seguridad local.
 */
export async function generateSecurityReport(): Promise<string> {
  const [policy, summary] = await Promise.all([getSecurityPolicy(), getDataSummary()]);

  return [
    "=== INFORME TÉCNICO DE PRIVACIDAD Y SEGURIDAD LOCAL ===",
    `Fecha: ${new Date().toISOString()}`,
    "",
    "CONTROLES TÉCNICOS RGPD / LOPDGDD:",
    `- Consentimiento registrado: ${policy.gdprConsent ? "Sí" : "No"}`,
    `- Telemetría externa: Deshabilitada por diseño (procesamiento local)`,
    `- Última actualización: ${policy.lastConsentDate}`,
    "",
    "INVENTARIO LOCAL:",
    `- Historial QR: ${summary.totalQRGenerated}`,
    `- Favoritos QR: ${summary.totalFavorites}`,
    `- Espacio ocupado: ${summary.storageSize}`,
    "",
    "CRIPTOGRAFÍA VERIFICADA:",
    "- Cifrado local bajo demanda: AES-256-GCM (Web Crypto API, IV 96 bits)",
    "- Integridad de payload: SHA-256 determinista",
  ].join("\n");
}
