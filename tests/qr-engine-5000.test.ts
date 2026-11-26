import { describe, expect, it } from "vitest";
import {
  MAX_PROMPT_CHARS,
  buildEmailPayload,
  buildPhonePayload,
  buildSmsPayload,
  buildUrlPayload,
  buildVCardPayload,
  buildWifiPayload,
  calculateContrastRatio,
  decodeQRFromRGBA,
  generateLocalQRPngDataUrl,
  generateLocalQRSVG,
  generateMultiPartQRSVG,
  rasterizeQRMatrixToRGBA,
  reassembleMultiQRPayloads,
  splitPayloadForMultiQR,
} from "../lib/qr-engine";
import { generateQRWithLogo } from "../lib/qr-server-service";

describe("Motor QR ISO/IEC 18004 y Soporte Extendido de 5.000 Caracteres", () => {
  it("renderiza las 5 geometrías modulares y emblema central con nivel H", () => {
    const shapes = ["square", "rounded", "circle", "diamond", "organic"] as const;
    for (const shape of shapes) {
      const svg = generateLocalQRSVG("https://belentani.es", {
        moduleShape: shape,
        finderStyle: shape === "circle" ? "circle" : "rounded",
        logoText: "QRP",
        darkColor: "#0F172A",
        lightColor: "#FFFFFF",
      });
      expect(svg).toContain("<svg");
      expect(svg).toContain("QRP");
      expect(svg).toContain("</svg>");
    }
  });

  it("genera Data URL PNG local válido y soporta generateQRWithLogo", async () => {
    const png = await generateLocalQRPngDataUrl("QR Pro Enterprise Local", {
      width: 256,
      darkColor: "#111827",
      lightColor: "#F8FAFC",
    });
    expect(png.startsWith("data:image/png;base64,")).toBe(true);

    const withLogo = await generateQRWithLogo("https://belentani.es", "B7", {
      size: 320,
      darkColor: "#0F172A",
      lightColor: "#FFFFFF",
    });
    expect(withLogo.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeURIComponent(withLogo)).toContain("B7");
  });

  it("construye cargas útiles RFC válidas y escapadas (Wi-Fi, vCard, Email, SMS, Tel, URL)", () => {
    const wifi = buildWifiPayload({
      ssid: "Oficina;Central",
      password: 'clave"segura',
      security: "WPA",
      hidden: true,
    });
    expect(wifi).toBe('WIFI:T:WPA;S:Oficina\\;Central;P:clave\\"segura;H:true;;');

    const vcard = buildVCardPayload({
      firstName: "Pedro",
      lastName: "Belentani",
      organization: "Belentani Studio",
      email: "pedro@ejemplo.es",
      phone: "+34600112233",
    });
    expect(vcard).toContain("BEGIN:VCARD");
    expect(vcard).toContain("FN:Pedro Belentani");
    expect(vcard).toContain("END:VCARD");

    expect(buildEmailPayload({ to: "info@ejemplo.es", subject: "Hola QR" })).toBe(
      "mailto:info@ejemplo.es?subject=Hola%20QR"
    );
    expect(buildSmsPayload({ phone: "+34 600 123 456", message: "Prueba" })).toBe(
      "SMSTO:+34600123456:Prueba"
    );
    expect(buildPhonePayload("+34 (600) 999-888")).toBe("tel:+34600999888");
    expect(buildUrlPayload("belentani.es/proyecto")).toBe("https://belentani.es/proyecto");
  });

  it("calcula el ratio de contraste WCAG 2.1 con precisión matemática", () => {
    const bw = calculateContrastRatio("#000000", "#FFFFFF");
    expect(bw.ratio).toBe(21);
    expect(bw.wcagAA).toBe(true);
    expect(bw.wcagAAA).toBe(true);
    expect(bw.scannable).toBe(true);

    const inverted = calculateContrastRatio("#FFFFFF", "#000000");
    expect(inverted.invertedWarning).toBe(true);
    expect(inverted.scannable).toBe(false);

    const low = calculateContrastRatio("#94A3B8", "#CBD5E1");
    expect(low.wcagAA).toBe(false);
  });

  it("decodifica en bucle cerrado con jsQR incluyendo colores personalizados", () => {
    const original = "Verificación óptica ISO/IEC 18004 — L'Hospitalet 2026";
    const raster = rasterizeQRMatrixToRGBA(original, {
      scale: 8,
      margin: 4,
      darkColor: "#0F172A",
      lightColor: "#F8FAFC",
      errorCorrectionLevel: "Q",
    });
    const decoded = decodeQRFromRGBA(raster.data, raster.width, raster.height);
    expect(decoded).not.toBeNull();
    expect(decoded?.content).toBe(original);
  });

  it("codifica, escanea ópticamente y reensambla un prompt completo de exactamente 5.000 caracteres", () => {
    expect(MAX_PROMPT_CHARS).toBe(5000);
    const seedBlock =
      "ORDEN MAESTRA QR PRO 5K — Arquitectura áéíóúñü, seguridad AES-256-GCM y matriz vectorial. ";
    const full5000 = seedBlock.repeat(60).slice(0, 5000);
    expect(full5000.length).toBe(5000);

    const multi = generateMultiPartQRSVG(full5000, {
      moduleShape: "rounded",
      darkColor: "#0F172A",
      lightColor: "#FFFFFF",
    });

    expect(multi.isMultiPart).toBe(true);
    expect(multi.totalChars).toBe(5000);
    expect(multi.parts.length).toBeGreaterThanOrEqual(3);

    // Escanea ópticamente CADA símbolo de la secuencia con jsQR y reconstruye en orden inverso
    const opticallyDecoded = [...multi.parts].reverse().map((part) => {
      const raster = rasterizeQRMatrixToRGBA(part.payload, { scale: 5, margin: 4 });
      const scan = decodeQRFromRGBA(raster.data, raster.width, raster.height);
      expect(scan).not.toBeNull();
      return scan!.content;
    });

    const reconstructed = reassembleMultiQRPayloads(opticallyDecoded);
    expect(reconstructed).toBe(full5000);
    expect(reconstructed.length).toBe(5000);

    expect(() => splitPayloadForMultiQR("x".repeat(5001))).toThrow();
  });
});
