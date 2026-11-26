import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyFilterToRGBA,
  computeCRC32,
  embedPayloadInRGBA,
  embedQRInImage,
  extractPayloadFromRGBA,
  extractQRFromImage,
  generateShapeFromDescription,
} from "../lib/image-steganography-service";

const memoryStore = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => memoryStore.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      memoryStore.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      memoryStore.delete(key);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      keys.forEach((k) => memoryStore.delete(k));
    }),
    getAllKeys: vi.fn(async () => Array.from(memoryStore.keys())),
  },
}));

import {
  createQRMetadata,
  decryptData,
  deleteAllUserData,
  encryptData,
  exportPortableUserData,
  generateQRHash,
  updateGDPRConsent,
  validateQRIntegrity,
} from "../lib/security-service";

describe("Esteganografía LSB + CRC32 y Criptografía Web Crypto AES-256-GCM", () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  it("incrusta y extrae sin pérdidas un prompt de 5.000 caracteres y detecta corrupción de 1 bit", () => {
    const prompt5k = "Esteganografía verificada con acentos áéíóú y símbolos Ω · ".repeat(90).slice(0, 5000);
    expect(prompt5k.length).toBe(5000);

    const carrier = new Uint8ClampedArray(180 * 180 * 4).fill(128);
    const encoded = embedPayloadInRGBA(carrier, prompt5k);
    expect(extractPayloadFromRGBA(encoded)).toBe(prompt5k);

    // Alterar un único LSB en la carga útil debe invalidar el CRC32 IEEE 802.3
    const tampered = new Uint8ClampedArray(encoded);
    tampered[400] ^= 1;
    expect(extractPayloadFromRGBA(tampered)).toBeNull();
  });

  it("verifica vector estándar IEEE 802.3 CRC32 ('123456789' -> 0xCBF43926)", () => {
    const vec = new TextEncoder().encode("123456789");
    expect(computeCRC32(vec)).toBe(0xcbf43926);
  });

  it("deriva estilos geométricos desde prompts semánticos de hasta 5.000 caracteres y aplica filtros RGBA", async () => {
    const longPrompt =
      "Diseño prisma diamante #4F46E5 con estructura cristalina ".padEnd(5000, "x");
    const shape = await generateShapeFromDescription(longPrompt);
    expect(shape.moduleShape).toBe("diamond");
    expect(shape.accentColor).toBe("#4F46E5");

    await expect(generateShapeFromDescription("a".repeat(5001))).rejects.toThrow();

    const tagged = await embedQRInImage("data:image/png;base64,AAAA", promptSlice(1200));
    expect(await extractQRFromImage(tagged)).toBe(promptSlice(1200));

    const sample = new Uint8ClampedArray([200, 100, 50, 255]);
    const gray = applyFilterToRGBA(sample, "grayscale");
    expect(gray[0]).toBe(gray[1]);
    expect(gray[1]).toBe(gray[2]);
  });

  it("cifra y descifra con AES-256-GCM real, valida SHA-256 determinista y ejecuta borrado RGPD", async () => {
    const hashA = await generateQRHash("payload-inmutable");
    const hashB = await generateQRHash("payload-inmutable");
    expect(hashA).toHaveLength(64);
    expect(hashA).toBe(hashB);
    expect(await validateQRIntegrity("payload-inmutable", hashA)).toBe(true);
    expect(await validateQRIntegrity("payload-alterado", hashA)).toBe(false);

    const secretObj = { qr: "WIFI:T:WPA;S:Corp;P: UltraSecret123;;", count: 42 };
    const cipher1 = await encryptData(secretObj);
    const cipher2 = await encryptData(secretObj);
    expect(cipher1.startsWith("v2:")).toBe(true);
    // Dos cifrados del mismo objeto usan IV aleatorio distinto
    expect(cipher1).not.toBe(cipher2);

    const decrypted = await decryptData<typeof secretObj>(cipher1);
    expect(decrypted).toEqual(secretObj);

    // Manipular 1 byte del texto cifrado debe lanzar excepción de autenticación GCM
    const broken = cipher1.slice(0, -2) + (cipher1.endsWith("00") ? "ff" : "00");
    await expect(decryptData(broken)).rejects.toThrow();

    await updateGDPRConsent(true);
    const meta = await createQRMetadata("https://belentani.es");
    expect(meta.encrypted).toBe(true);

    memoryStore.set("@qr_pro_history", JSON.stringify([{ id: "1", content: "test" }]));
    const portable = JSON.parse(await exportPortableUserData()) as {
      summary: { totalQRGenerated: number };
      policy: { gdprConsent: boolean };
    };
    expect(portable.policy.gdprConsent).toBe(true);
    expect(portable.summary.totalQRGenerated).toBe(1);

    await deleteAllUserData();
    expect(memoryStore.size).toBe(0);
  });
});

function promptSlice(n: number): string {
  return "QRProEnterpriseStego_".repeat(100).slice(0, n);
}
