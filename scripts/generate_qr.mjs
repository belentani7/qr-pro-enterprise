#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const MAX_PROMPT_CHARS = 5000;

function printHelp() {
  console.log(`QR Pro Enterprise — CLI Generador ISO/IEC 18004 (hasta 5.000 caracteres)

Uso:
  node scripts/generate_qr.mjs <contenido> [opciones]
  node scripts/generate_qr.mjs --batch <archivo.txt|archivo.json> [--outdir <carpeta>]

Opciones:
  -h, --help            Muestra esta ayuda y termina con código 0.
  -o, --out <ruta>      Ruta de salida (por defecto: expo-qr-code.png o qr-output.svg).
  -f, --format <fmt>    Formato: png | svg | utf8 (por defecto: según extensión o png).
  -w, --width <px>      Ancho en píxeles entre 64 y 4096 (por defecto: 512).
  -e, --ecc <nivel>     Corrección Reed-Solomon: L | M | Q | H (por defecto: M).
  --dark <#RRGGBB>      Color hexadecimal de módulos oscuros (por defecto: #000000).
  --light <#RRGGBB>     Color hexadecimal de fondo (por defecto: #FFFFFF).
  --batch <archivo>     Procesa múltiples líneas o entradas JSON en lote.
  --outdir <carpeta>    Carpeta destino para lotes o secuencias multi-QR.

Ejemplos:
  node scripts/generate_qr.mjs "https://belentani.es" --format svg --out qr.svg
  node scripts/generate_qr.mjs "Texto o prompt extenso..." --ecc H --dark "#0F172A"
`);
}

function splitLongText(text, maxBytes = 1800) {
  const enc = new TextEncoder();
  if (enc.encode(text).byteLength <= 2200) return [text];
  const chunks = [];
  let cur = "";
  let bytes = 0;
  for (const cp of text) {
    const b = enc.encode(cp).byteLength;
    if (bytes + b > maxBytes && cur.length > 0) {
      chunks.push(cur);
      cur = cp;
      bytes = b;
    } else {
      cur += cp;
      bytes += b;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.map((c, idx) => `[QRP ${idx + 1}/${chunks.length}] ${c}`);
}

async function renderSingle(payload, opts, outputPath) {
  const levels = opts.ecc === "H" ? ["H", "Q", "M", "L"] : [opts.ecc, "L"];
  let lastErr;
  for (const level of levels) {
    try {
      if (opts.format === "utf8") {
        const str = await QRCode.toString(payload, { type: "utf8", errorCorrectionLevel: level });
        console.log(str);
        return;
      }
      if (opts.format === "svg") {
        const svg = await QRCode.toString(payload, {
          type: "svg",
          width: opts.width,
          margin: 2,
          errorCorrectionLevel: level,
          color: { dark: opts.dark, light: opts.light },
        });
        fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
        fs.writeFileSync(outputPath, svg, "utf8");
        return;
      }
      fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
      await QRCode.toFile(outputPath, payload, {
        width: opts.width,
        margin: 2,
        errorCorrectionLevel: level,
        color: { dark: opts.dark, light: opts.light },
      });
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  let content = "";
  let out = "";
  let format = "";
  let width = 512;
  let ecc = "M";
  let dark = "#000000";
  let light = "#FFFFFF";
  let batchFile = "";
  let outDir = "qr-batch-out";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === "-o" || arg === "--out") && args[i + 1]) {
      out = args[++i];
    } else if ((arg === "-f" || arg === "--format") && args[i + 1]) {
      format = args[++i].toLowerCase();
    } else if ((arg === "-w" || arg === "--width") && args[i + 1]) {
      width = Number.parseInt(args[++i], 10) || 512;
    } else if ((arg === "-e" || arg === "--ecc") && args[i + 1]) {
      ecc = args[++i].toUpperCase();
    } else if (arg === "--dark" && args[i + 1]) {
      dark = args[++i];
    } else if (arg === "--light" && args[i + 1]) {
      light = args[++i];
    } else if (arg === "--batch" && args[i + 1]) {
      batchFile = args[++i];
    } else if (arg === "--outdir" && args[i + 1]) {
      outDir = args[++i];
    } else if (!arg.startsWith("-") && !content) {
      content = arg;
    }
  }

  if (batchFile) {
    const raw = fs.readFileSync(batchFile, "utf8");
    const items = batchFile.endsWith(".json")
      ? JSON.parse(raw)
      : raw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
    const resolvedFormat = format || "svg";
    fs.mkdirSync(outDir, { recursive: true });
    let count = 0;
    for (const entry of items) {
      const text = typeof entry === "string" ? entry : entry.content;
      if (!text || text.length > MAX_PROMPT_CHARS) continue;
      count++;
      const target = path.join(outDir, `qr_${String(count).padStart(3, "0")}.${resolvedFormat}`);
      await renderSingle(text, { format: resolvedFormat, width, ecc, dark, light }, target);
    }
    console.log(`[qr-cli] ${count} códigos QR generados en ${outDir}`);
    return;
  }

  if (!content.trim()) {
    console.error("Error: falta el contenido del QR. Usa --help para ver opciones.");
    process.exit(1);
  }
  if (content.length > MAX_PROMPT_CHARS) {
    console.error(`Error: el contenido supera el límite de ${MAX_PROMPT_CHARS} caracteres.`);
    process.exit(1);
  }

  const resolvedFormat =
    format || (out.toLowerCase().endsWith(".svg") ? "svg" : "png");
  const defaultOut = resolvedFormat === "svg" ? "qr-output.svg" : "expo-qr-code.png";
  const finalOut = out || defaultOut;

  const parts = splitLongText(content);
  if (parts.length === 1) {
    await renderSingle(parts[0], { format: resolvedFormat, width, ecc, dark, light }, finalOut);
    if (resolvedFormat !== "utf8") {
      console.log(`[qr-cli] QR generado en ${finalOut} (${content.length} caracteres)`);
    }
  } else {
    const parsed = path.parse(finalOut);
    for (let idx = 0; idx < parts.length; idx++) {
      const partPath = path.join(
        parsed.dir || ".",
        `${parsed.name}_parte_${idx + 1}_de_${parts.length}${parsed.ext || `.${resolvedFormat}`}`
      );
      await renderSingle(parts[idx], { format: resolvedFormat, width, ecc, dark, light }, partPath);
    }
    console.log(`[qr-cli] Secuencia de ${parts.length} códigos QR generada (${content.length} caracteres)`);
  }
}

main().catch((err) => {
  console.error("[qr-cli] Fallo:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
