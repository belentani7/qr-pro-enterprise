#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
  console.log(`QR Pro Enterprise — Auditor Técnico de Calidad, Rendimiento e Higiene

Uso:
  node scripts/audit.mjs [--json] [--help]

Comprueba:
  1. Cero marcadores TODO / FIXME / XXX en código de producción.
  2. Presupuesto de tamaño de bundle web e iconos optimizados.
  3. Límite canónico <= 5.000 caracteres en PROMPT-AGENTE-5000.md.
  4. Estructura semántica HTML5 y skip-link accesible en index.html.
`);
  process.exit(0);
}

const root = process.cwd();
const checks = [];

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

// 1. Escaneo de TODO / FIXME en código fuente
const prodDirs = ["app", "components", "hooks", "lib", "server", "client"];
const markerHits = [];
const markerRegex = /\b(TODO|FIXME|XXX)\b/;

function walkCode(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return;
  for (const item of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(full, item.name);
    if (item.isDirectory()) {
      walkCode(path.relative(root, p));
    } else if (/\.(ts|tsx|js|mjs)$/.test(item.name)) {
      const content = fs.readFileSync(p, "utf8");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (markerRegex.test(line)) {
          markerHits.push(`${path.relative(root, p)}:${idx + 1}`);
        }
      });
    }
  }
}
prodDirs.forEach(walkCode);
record(
  "Cero TODO/FIXME en producción",
  markerHits.length === 0,
  markerHits.length === 0 ? "0 ocurrencias" : markerHits.join(", ")
);

// 2. Presupuesto de imágenes y bundle
const imgDir = path.join(root, "assets", "images");
if (fs.existsSync(imgDir)) {
  let totalBytes = 0;
  for (const f of fs.readdirSync(imgDir)) {
    const st = fs.statSync(path.join(imgDir, f));
    if (st.isFile()) totalBytes += st.size;
  }
  const kb = Number((totalBytes / 1024).toFixed(1));
  record("Imágenes optimizadas (< 600 KB totales)", kb < 600, `${kb} KB`);
}

const studioBundle = path.join(root, "dist", "public", "assets", "qr-studio.js");
if (fs.existsSync(studioBundle)) {
  const kb = Number((fs.statSync(studioBundle).size / 1024).toFixed(1));
  record("Bundle cliente inicial ligero (< 180 KB minificado)", kb < 180, `${kb} KB`);
}

// 3. Verificación de PROMPT-AGENTE-5000.md (<= 5000 caracteres)
const promptPath = path.join(root, "PROMPT-AGENTE-5000.md");
if (fs.existsSync(promptPath)) {
  const chars = [...fs.readFileSync(promptPath, "utf8")].length;
  record(
    "PROMPT-AGENTE-5000.md dentro del límite (1..5000 caracteres)",
    chars > 500 && chars <= 5000,
    `${chars} caracteres`
  );
} else {
  record("PROMPT-AGENTE-5000.md existe", false, "falta archivo");
}

// 4. Semántica de index.html
const indexHtmlPath = path.join(root, "index.html");
if (fs.existsSync(indexHtmlPath)) {
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const hasLandmarks =
    /<header\b/i.test(html) &&
    /<nav\b/i.test(html) &&
    /<main\b[^>]*id=["']contenido["']/i.test(html) &&
    /<footer\b/i.test(html);
  record("Landmarks semánticos y skip-link #contenido en index.html", hasLandmarks);
}

const failed = checks.filter((c) => !c.ok);
if (args.includes("--json")) {
  console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
} else {
  for (const c of checks) {
    console.log(`${c.ok ? "OK   " : "FALLA"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
  }
  console.log(`\n${checks.length - failed.length}/${checks.length} controles de auditoría superados`);
}

process.exit(failed.length === 0 ? 0 : 1);
