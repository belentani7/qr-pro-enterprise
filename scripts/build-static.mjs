#!/usr/bin/env node
/**
 * Empaqueta la distribución web estática en dist/public combinando:
 * - index.html y páginas legales/accesibilidad (*.html)
 * - hero.js (motor GPU WebGL + fallback Canvas 2D)
 * - assets/ (CSS, iconos optimizados y bundle ESM compilado desde client/qr-studio.ts)
 * - brand/ y .well-known/
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist", "public");
const builtAssetsDir = path.join(root, "dist", "assets");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of fs.readdirSync(root)) {
  if (entry.endsWith(".html")) {
    fs.copyFileSync(path.join(root, entry), path.join(outDir, entry));
  }
}

if (fs.existsSync(path.join(root, "hero.js"))) {
  fs.copyFileSync(path.join(root, "hero.js"), path.join(outDir, "hero.js"));
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, item.name);
    const d = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyDirRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyDirRecursive(path.join(root, "assets"), path.join(outDir, "assets"));
copyDirRecursive(builtAssetsDir, path.join(outDir, "assets"));
copyDirRecursive(path.join(root, "brand"), path.join(outDir, "brand"));
copyDirRecursive(path.join(root, ".well-known"), path.join(outDir, ".well-known"));

const studioJs = path.join(outDir, "assets", "qr-studio.js");
if (!fs.existsSync(studioJs)) {
  console.error("ERROR: dist/public/assets/qr-studio.js no se generó.");
  process.exit(1);
}

const kb = (fs.statSync(studioJs).size / 1024).toFixed(1);
console.log(`[build:static] dist/public listo (qr-studio.js: ${kb} KB)`);
