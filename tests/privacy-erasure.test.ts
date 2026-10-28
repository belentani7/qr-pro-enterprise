import AsyncStorage from "@react-native-async-storage/async-storage";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQRMetadata, deleteAllUserData, encryptData, generateQRHash,
  generateSecurityReport, getDataSummary, validateQRIntegrity,
} from "../lib/security-service";

vi.mock("@react-native-async-storage/async-storage", () => {
  const memory = new Map<string, string>();
  return {
    default: {
      getItem: async (key: string) => memory.get(key) ?? null,
      setItem: async (key: string, value: string) => { memory.set(key, value); },
      getAllKeys: async () => Array.from(memory.keys()),
      multiRemove: async (keys: string[]) => { keys.forEach(key => memory.delete(key)); },
      clear: async () => { memory.clear(); },
    },
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("QR Pro privacy and integrity claims", () => {
  it("deletes the actual generated/scanned history and favorites, not just consent", async () => {
    await AsyncStorage.setItem("qr_history", JSON.stringify([{ type: "generated", content: "personal" }]));
    await AsyncStorage.setItem("qr_favorites", JSON.stringify([{ content: "personal" }]));
    await AsyncStorage.setItem("@qr_pro_consent", JSON.stringify({ gdprConsent: true }));
    await AsyncStorage.setItem("another_app_setting", "preserve");
    await deleteAllUserData();
    expect(await AsyncStorage.getItem("qr_history")).toBeNull();
    expect(await AsyncStorage.getItem("qr_favorites")).toBeNull();
    expect(await AsyncStorage.getItem("@qr_pro_consent")).toBeNull();
    expect(await AsyncStorage.getItem("another_app_setting")).toBe("preserve");
  });

  it("reports counts from real local entries, not hardcoded zeros", async () => {
    await AsyncStorage.setItem("qr_history", JSON.stringify([
      { type: "generated", timestamp: 1_700_000_000_000 },
      { type: "generated", timestamp: 1_700_000_000_001 },
      { type: "scanned", timestamp: 1_700_000_000_002 },
    ]));
    const result = await getDataSummary();
    expect(result.totalQRGenerated).toBe(2);
    expect(result.totalQRScanned).toBe(1);
    expect(result.storageSize).toMatch(/KB$/);
    expect(result.lastModified).toBe(new Date(1_700_000_000_002).toISOString());
  });

  it("creates reproducible checksums and detects accidental modifications", async () => {
    const checksum = await generateQRHash("hello-world");
    expect(checksum).toMatch(/^fnv1a32:[a-f0-9]{8}$/);
    expect(await generateQRHash("hello-world")).toBe(checksum);
    expect(await validateQRIntegrity("hello-world", checksum)).toBe(true);
    expect(await validateQRIntegrity("changed", checksum)).toBe(false);
  });

  it("never describes unencrypted data as encrypted", async () => {
    const metadata = await createQRMetadata("private");
    expect(metadata.encrypted).toBe(false);
    await expect(encryptData({ private: "data" })).rejects.toThrow(/no disponible/);
    const report = await generateSecurityReport();
    expect(report).toMatch(/NO IMPLEMENTADO/);
    expect(report).not.toMatch(/Cifrado.*Habilitada/);
    expect(report).toContain("Borrado de datos enviados a QR Server: NO DISPONIBLE");
    expect(report).toContain("Cumplimiento normativo: NO CERTIFICADO");
    expect(report).not.toContain("Portabilidad de Datos: Disponible");
  });

  it("shows honest third-party and encryption disclosures in the privacy screen", () => {
    const screen = readFileSync(new URL("../app/privacy-settings.tsx", import.meta.url), "utf8");
    expect(screen).toContain("QR Server");
    expect(screen).toContain("sin cifrado");
    expect(screen).toContain("no certifica cumplimiento RGPD");
    expect(screen).toContain("No se borran datos ya enviados a QR Server");
    expect(screen).not.toMatch(/Cumplimos con GDPR|Todos los datos encriptados|Solo datos locales, sin envío a servidores/);
    expect(screen).not.toContain("opacity-20");
  });
});
