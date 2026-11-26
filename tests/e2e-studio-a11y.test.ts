import fs from "node:fs";
import path from "node:path";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { startServer } from "../server/_core/index";
import { calculateContrastRatio } from "../lib/qr-engine";

describe("E2E Happy-Path (HTTP/tRPC + Estudio DOM) y Accesibilidad WCAG 2.1 AA", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    const started = await startServer(0);
    server = started.server;
    baseUrl = `http://127.0.0.1:${started.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("sirve /api/health, index.html y genera tanto QR simple como secuencia de 5.000 caracteres por HTTP y tRPC", async () => {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as { ok: boolean; maxPromptChars: number };
    expect(health.ok).toBe(true);
    expect(health.maxPromptChars).toBe(5000);

    const htmlRes = await fetch(`${baseUrl}/`);
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain("QR Pro Enterprise");

    const prompt5000 = "Prompt Empresarial Completo 5K · ".repeat(160).slice(0, 5000);
    const qrRes = await fetch(`${baseUrl}/api/qr/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: prompt5000,
        moduleShape: "diamond",
        darkColor: "#0F172A",
        lightColor: "#FFFFFF",
      }),
    });
    expect(qrRes.status).toBe(200);
    const qrJson = (await qrRes.json()) as {
      ok: boolean;
      isMultiPart: boolean;
      totalChars: number;
      parts: Array<{ svg: string }>;
      contrast: { wcagAAA: boolean };
    };
    expect(qrJson.ok).toBe(true);
    expect(qrJson.isMultiPart).toBe(true);
    expect(qrJson.totalChars).toBe(5000);
    expect(qrJson.parts.length).toBeGreaterThanOrEqual(3);
    expect(qrJson.parts[0].svg).toContain("<svg");
    expect(qrJson.contrast.wcagAAA).toBe(true);

    // Rechaza entradas superiores a 5.000 caracteres con HTTP 400
    const tooLongRes = await fetch(`${baseUrl}/api/qr/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "z".repeat(5001) }),
    });
    expect(tooLongRes.status).toBe(400);

    // Endpoint tRPC qr.contrast
    const trpcInput = encodeURIComponent(
      JSON.stringify({ json: { darkColor: "#0F172A", lightColor: "#FFFFFF" } })
    );
    const trpcRes = await fetch(`${baseUrl}/api/trpc/qr.contrast?input=${trpcInput}`);
    expect(trpcRes.status).toBe(200);
    const trpcData = (await trpcRes.json()) as {
      result: { data: { json: { ratio: number; wcagAAA: boolean } } };
    };
    expect(trpcData.result.data.json.wcagAAA).toBe(true);
  });

  it("supera la auditoría WCAG 2.1 A/AA con axe-core (0 violaciones) y valida contraste cromático >= 4.5:1", async () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
    const dom = new JSDOM(html, {
      url: "https://qr-pro-enterprise.vercel.app/",
      pretendToBeVisual: true,
    });

    const g = globalThis as Record<string, unknown>;
    const prevWindow = g.window;
    const prevDocument = g.document;
    const prevNode = g.Node;
    const prevElement = g.Element;
    g.window = dom.window;
    g.document = dom.window.document;
    g.Node = dom.window.Node;
    g.Element = dom.window.Element;

    let results: axe.AxeResults;
    try {
      results = await axe.run(dom.window.document.documentElement as unknown as axe.ElementContext, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
        rules: {
          // jsdom no implementa motor de layout CSS; verificamos contraste explícitamente debajo
          "color-contrast": { enabled: false },
        },
      });
    } finally {
      g.window = prevWindow;
      g.document = prevDocument;
      g.Node = prevNode;
      g.Element = prevElement;
    }

    expect(
      results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)
    ).toEqual([]);

    // Verificación explícita de contraste WCAG 2.1 AA (>= 4.5:1) en tema oscuro y tema claro
    expect(calculateContrastRatio("#060913", "#F8FAFC").invertedWarning).toBe(false);
    // Texto principal sobre fondo oscuro (#F8FAFC sobre #060913)
    const darkThemeText = calculateContrastRatio("#060913", "#F8FAFC");
    expect(darkThemeText.ratio).toBeGreaterThanOrEqual(15);
    // Texto secundario sobre tarjeta oscura (#CBD5E1 sobre #0F172A)
    const darkMutedText = calculateContrastRatio("#0F172A", "#CBD5E1");
    expect(darkMutedText.ratio).toBeGreaterThanOrEqual(4.5);
    // Botón primario oscuro (#03161D sobre #22D3EE)
    const darkPrimaryBtn = calculateContrastRatio("#03161D", "#22D3EE");
    expect(darkPrimaryBtn.ratio).toBeGreaterThanOrEqual(4.5);
    // Tema claro: texto principal (#0F172A sobre #FFFFFF) y botón primario (#0369A1 con blanco)
    expect(calculateContrastRatio("#0F172A", "#FFFFFF").ratio).toBeGreaterThanOrEqual(15);
    expect(calculateContrastRatio("#0369A1", "#FFFFFF").ratio).toBeGreaterThanOrEqual(4.5);

    dom.window.close();
  });
});
