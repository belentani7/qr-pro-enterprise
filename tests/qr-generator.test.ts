import { describe, it, expect } from "vitest";
import { generateQRUrl, validateQRContent } from "../lib/qr-server-service";

describe("QR Pro Generator Core Tests", () => {
  it("should validate valid contents correctly", () => {
    expect(validateQRContent("https://example.com")).toBe(true);
    expect(validateQRContent("Hola Mundo")).toBe(true);
  });

  it("should reject empty or overly long contents", () => {
    expect(validateQRContent("")).toBe(false);
    expect(validateQRContent("   ")).toBe(false);
    expect(validateQRContent("a".repeat(3000))).toBe(false);
  });

  it("should construct correct QR server URL with options", () => {
    const url = generateQRUrl("https://test.com", {
      size: 400,
      darkColor: "FF0000",
      lightColor: "00FF00",
      format: "png",
    });

    expect(url).toContain("api.qrserver.com");
    expect(url).toContain("size=400x400");
    expect(url).toContain("color=FF0000");
    expect(url).toContain("bgcolor=00FF00");
    expect(url).toContain("format=png");
  });
});
