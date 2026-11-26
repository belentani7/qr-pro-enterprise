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
  generateMultiPartQRSVG,
  rasterizeQRMatrixToRGBA,
  reassembleMultiQRPayloads,
  type MultiQRPart,
  type QRErrorCorrectionLevel,
  type QRFinderStyle,
  type QRModuleShape,
} from "../lib/qr-engine";
import {
  computeCRC32,
  embedPayloadInRGBA,
  extractPayloadFromRGBA,
  generateShapeFromDescription,
} from "../lib/image-steganography-service";

type StudioMode = "prompt" | "url" | "wifi" | "vcard" | "email" | "sms" | "shape";

interface VaultEntry {
  id: string;
  mode: StudioMode;
  label: string;
  payload: string;
  sha256: string;
  cipher: string;
  createdAt: string;
}

declare global {
  interface Window {
    QRProWebGL?: {
      setPalette: (hexA: string, hexB: string, modCount?: number) => void;
      togglePause: () => boolean;
      isPaused: () => boolean;
      getBackend: () => string;
    };
  }
}

const VAULT_STORAGE_KEY = "qr_pro_enterprise_vault_v2";
const VAULT_KEY_STORAGE = "qr_pro_enterprise_aes_key_v2";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  );
  return bytesToHex(new Uint8Array(digest));
}

async function getBrowserAesKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(VAULT_KEY_STORAGE);
  let raw: Uint8Array;
  if (stored && /^[0-9a-fA-F]{64}$/.test(stored)) {
    raw = hexToBytes(stored);
  } else {
    raw = new Uint8Array(32);
    crypto.getRandomValues(raw);
    localStorage.setItem(VAULT_KEY_STORAGE, bytesToHex(raw));
  }
  return crypto.subtle.importKey(
    "raw",
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptVaultPayload(plain: string): Promise<string> {
  const key = await getBrowserAesKey();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer
  );
  return `v2:${bytesToHex(iv)}:${bytesToHex(new Uint8Array(buf))}`;
}

async function decryptVaultPayload(cipher: string): Promise<string> {
  const [ver, ivHex, dataHex] = cipher.split(":");
  if (ver !== "v2" || !ivHex || !dataHex) {
    throw new Error("Formato AES-GCM no reconocido");
  }
  const key = await getBrowserAesKey();
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(dataHex);
  const plainBuf = await crypto.subtle.decrypt(
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
  return new TextDecoder().decode(plainBuf);
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function initQRStudio(): void {
  const studioRoot = document.getElementById("estudio");
  if (!studioRoot) return;

  let currentMode: StudioMode = "prompt";
  let currentParts: MultiQRPart[] = [];
  let activePartIdx = 0;
  let lastStegoBuffer: { data: Uint8ClampedArray; width: number; height: number } | null = null;
  const scannedSequenceBuffer: string[] = [];

  const q = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel);

  const stageEl = q<HTMLDivElement>("#qr-stage");
  const statusEl = q<HTMLParagraphElement>("#qr-live-status");
  const contrastEl = q<HTMLDivElement>("#contrast-audit");
  const partsBarEl = q<HTMLDivElement>("#qr-parts-bar");
  const promptInput = q<HTMLTextAreaElement>("#input-prompt");
  const promptCountEl = q<HTMLSpanElement>("#prompt-char-count");
  const promptBytesEl = q<HTMLSpanElement>("#prompt-byte-count");
  const shapePromptInput = q<HTMLTextAreaElement>("#input-shape-prompt");
  const shapePromptCountEl = q<HTMLSpanElement>("#shape-prompt-count");

  const darkColorInput = q<HTMLInputElement>("#opt-dark-color");
  const lightColorInput = q<HTMLInputElement>("#opt-light-color");
  const moduleShapeSelect = q<HTMLSelectElement>("#opt-module-shape");
  const finderStyleSelect = q<HTMLSelectElement>("#opt-finder-style");
  const eccSelect = q<HTMLSelectElement>("#opt-ecc");
  const logoInput = q<HTMLInputElement>("#opt-logo-text");

  function updateCounters(): void {
    if (promptInput && promptCountEl && promptBytesEl) {
      const val = promptInput.value;
      const bytes = new TextEncoder().encode(val).byteLength;
      promptCountEl.textContent = `${val.length} / ${MAX_PROMPT_CHARS} caracteres`;
      promptBytesEl.textContent =
        bytes > 2200
          ? `${bytes} bytes UTF-8 · Secuencia multi-QR automática`
          : `${bytes} bytes UTF-8 · Símbolo único ISO/IEC 18004`;
    }
    if (shapePromptInput && shapePromptCountEl) {
      shapePromptCountEl.textContent = `${shapePromptInput.value.length} / ${MAX_PROMPT_CHARS} caracteres`;
    }
  }

  function resolveCurrentPayload(): string {
    switch (currentMode) {
      case "prompt":
        return (promptInput?.value ?? "").trim() || "https://github.com/belentani7/qr-pro-enterprise";
      case "url": {
        const raw = q<HTMLInputElement>("#input-url")?.value ?? "";
        return raw.trim() ? buildUrlPayload(raw) : "https://github.com/belentani7/qr-pro-enterprise";
      }
      case "wifi": {
        const ssid = q<HTMLInputElement>("#input-wifi-ssid")?.value.trim() || "QRPro_Enterprise_5G";
        const password = q<HTMLInputElement>("#input-wifi-pass")?.value ?? "";
        const security =
          (q<HTMLSelectElement>("#input-wifi-sec")?.value as "WPA" | "WEP" | "nopass") ?? "WPA";
        return buildWifiPayload({ ssid, password, security });
      }
      case "vcard": {
        const firstName = q<HTMLInputElement>("#input-vcard-name")?.value.trim() || "Pedro Belentani";
        const organization = q<HTMLInputElement>("#input-vcard-org")?.value ?? "";
        const phone = q<HTMLInputElement>("#input-vcard-phone")?.value ?? "";
        const email = q<HTMLInputElement>("#input-vcard-email")?.value ?? "";
        return buildVCardPayload({ firstName, organization, phone, email });
      }
      case "email": {
        const to = q<HTMLInputElement>("#input-email-to")?.value.trim() || "contacto@ejemplo.es";
        const subject = q<HTMLInputElement>("#input-email-sub")?.value ?? "";
        const body = q<HTMLTextAreaElement>("#input-email-body")?.value ?? "";
        return buildEmailPayload({ to, subject, body });
      }
      case "sms": {
        const phone = q<HTMLInputElement>("#input-sms-phone")?.value.trim() || "+34600000000";
        const message = q<HTMLInputElement>("#input-sms-msg")?.value ?? "";
        return message.trim() ? buildSmsPayload({ phone, message }) : buildPhonePayload(phone);
      }
      case "shape": {
        const target = q<HTMLInputElement>("#input-shape-content")?.value.trim();
        return target || "https://github.com/belentani7/qr-pro-enterprise";
      }
    }
  }

  function renderPartButtons(): void {
    if (!partsBarEl) return;
    partsBarEl.innerHTML = "";
    if (currentParts.length <= 1) {
      partsBarEl.classList.add("hidden");
      return;
    }
    partsBarEl.classList.remove("hidden");
    currentParts.forEach((part, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "part-btn";
      btn.textContent = `Parte ${part.index}/${part.total}`;
      btn.setAttribute("aria-current", idx === activePartIdx ? "true" : "false");
      btn.addEventListener("click", () => {
        activePartIdx = idx;
        renderActiveQRPart();
        renderPartButtons();
      });
      partsBarEl.appendChild(btn);
    });
  }

  function renderActiveQRPart(): void {
    if (!stageEl || currentParts.length === 0) return;
    const part = currentParts[activePartIdx] ?? currentParts[0];
    stageEl.innerHTML = part.svg;
  }

  async function renderQR(): Promise<void> {
    updateCounters();
    try {
      const payload = resolveCurrentPayload();
      let darkColor = darkColorInput?.value ?? "#0F172A";
      const lightColor = lightColorInput?.value ?? "#FFFFFF";
      let moduleShape = (moduleShapeSelect?.value as QRModuleShape) ?? "rounded";
      const finderStyle = (finderStyleSelect?.value as QRFinderStyle) ?? "rounded";
      const errorCorrectionLevel = (eccSelect?.value as QRErrorCorrectionLevel) ?? "M";
      const logoText = logoInput?.value.trim() ?? "";

      if (currentMode === "shape" && shapePromptInput?.value.trim()) {
        const derived = await generateShapeFromDescription(shapePromptInput.value);
        moduleShape = derived.moduleShape;
        darkColor = derived.accentColor;
        if (darkColorInput) darkColorInput.value = darkColor;
        if (moduleShapeSelect) moduleShapeSelect.value = moduleShape;
      }

      const contrast = calculateContrastRatio(darkColor, lightColor);
      if (contrastEl) {
        contrastEl.dataset.state = contrast.scannable && contrast.wcagAA ? "ok" : "warn";
        const grade = contrast.wcagAAA ? "WCAG AAA" : contrast.wcagAA ? "WCAG AA" : "Contraste bajo";
        const scanLabel = contrast.invertedWarning
          ? "Aviso: colores invertidos (algunos lectores antiguos requieren módulos oscuros)"
          : contrast.scannable
            ? "Óptimo para lectura óptica"
            : "Riesgo de fallo de lectura (< 3:1)";
        contrastEl.textContent = `Contraste ${contrast.ratio}:1 · ${grade} · ${scanLabel}`;
      }

      const result = generateMultiPartQRSVG(payload, {
        width: 320,
        margin: 2,
        darkColor,
        lightColor,
        errorCorrectionLevel,
        moduleShape,
        finderStyle,
        logoText,
        title: `Código QR (${currentMode})`,
      });

      currentParts = result.parts;
      if (activePartIdx >= currentParts.length) activePartIdx = 0;
      renderActiveQRPart();
      renderPartButtons();

      if (statusEl) {
        statusEl.textContent = result.isMultiPart
          ? `Secuencia generada: ${result.parts.length} símbolos QR (${result.totalChars} caracteres / ${result.totalBytes} bytes).`
          : `QR vectorial listo (${result.totalChars} caracteres / ${result.totalBytes} bytes · ECC ${logoText ? "H" : errorCorrectionLevel}).`;
      }

      if (window.QRProWebGL) {
        window.QRProWebGL.setPalette(darkColor === "#000000" ? "#22D3EE" : darkColor, "#818CF8");
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err instanceof Error ? err.message : "Error validando datos del QR";
      }
    }
  }

  // Pestañas de modo
  document.querySelectorAll<HTMLButtonElement>("[data-studio-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextMode = btn.dataset.studioMode as StudioMode;
      currentMode = nextMode;
      activePartIdx = 0;
      document.querySelectorAll<HTMLButtonElement>("[data-studio-mode]").forEach((b) => {
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      document.querySelectorAll<HTMLElement>("[data-mode-panel]").forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.modePanel !== nextMode);
      });
      void renderQR();
    });
  });

  // Paletas rápidas
  document.querySelectorAll<HTMLButtonElement>("[data-palette-dark]").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (darkColorInput && chip.dataset.paletteDark) {
        darkColorInput.value = chip.dataset.paletteDark;
      }
      if (lightColorInput && chip.dataset.paletteLight) {
        lightColorInput.value = chip.dataset.paletteLight;
      }
      void renderQR();
    });
  });

  // Escucha reactiva en todos los controles del estudio
  studioRoot.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", () => {
      void renderQR();
    });
    el.addEventListener("change", () => {
      void renderQR();
    });
  });

  // Descarga SVG / PNG / Copia
  q<HTMLButtonElement>("#btn-download-svg")?.addEventListener("click", () => {
    if (currentParts.length === 0) return;
    currentParts.forEach((part) => {
      const suffix = part.total > 1 ? `_parte_${part.index}_de_${part.total}` : "";
      triggerDownload(part.dataUrl, `qr-pro-enterprise${suffix}.svg`);
    });
  });

  q<HTMLButtonElement>("#btn-download-png")?.addEventListener("click", async () => {
    if (currentParts.length === 0) return;
    const active = currentParts[activePartIdx] ?? currentParts[0];
    const pngUrl = await generateLocalQRPngDataUrl(active.payload, {
      width: 640,
      margin: 2,
      darkColor: darkColorInput?.value ?? "#0F172A",
      lightColor: lightColorInput?.value ?? "#FFFFFF",
    });
    triggerDownload(pngUrl, `qr-pro-enterprise_${active.index}.png`);
  });

  q<HTMLButtonElement>("#btn-copy-payload")?.addEventListener("click", async () => {
    try {
      const payload = resolveCurrentPayload();
      await navigator.clipboard.writeText(payload);
      if (statusEl) statusEl.textContent = "Contenido copiado al portapapeles.";
    } catch {
      if (statusEl) statusEl.textContent = "No se pudo acceder al portapapeles en este navegador.";
    }
  });

  // Verificación óptica en bucle cerrado con jsQR
  q<HTMLButtonElement>("#btn-self-verify")?.addEventListener("click", () => {
    if (currentParts.length === 0) return;
    const decodedChunks: string[] = [];
    for (const part of currentParts) {
      const raster = rasterizeQRMatrixToRGBA(part.payload, { scale: 6, margin: 4 });
      const decoded = decodeQRFromRGBA(raster.data, raster.width, raster.height);
      if (!decoded) {
        if (statusEl) statusEl.textContent = `Fallo al verificar ópticamente la parte ${part.index}.`;
        return;
      }
      decodedChunks.push(decoded.content);
    }
    const reconstructed = reassembleMultiQRPayloads(decodedChunks);
    if (statusEl) {
      statusEl.textContent = `Verificación óptica jsQR superada: ${currentParts.length}/${currentParts.length} símbolos decodificados (${reconstructed.length} caracteres íntegros).`;
    }
  });

  // Escáner de archivos de imagen locales con jsQR
  const scanInput = q<HTMLInputElement>("#scanner-file-input");
  const scanResultEl = q<HTMLDivElement>("#scanner-result");
  scanInput?.addEventListener("change", () => {
    const file = scanInput.files?.[0];
    if (!file || !scanResultEl) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const decoded = decodeQRFromRGBA(imgData.data, w, h);
        if (!decoded) {
          scanResultEl.textContent = "No se detectó un código QR válido en la imagen seleccionada.";
          return;
        }
        if (/^\[QRP \d+\/\d+\]/.test(decoded.content)) {
          if (!scannedSequenceBuffer.includes(decoded.content)) {
            scannedSequenceBuffer.push(decoded.content);
          }
          const merged = reassembleMultiQRPayloads(scannedSequenceBuffer);
          scanResultEl.textContent = `Secuencia detectada (${scannedSequenceBuffer.length} partes): ${merged}`;
        } else {
          scanResultEl.textContent = `Decodificado (Versión ${decoded.version}): ${decoded.content}`;
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  // Laboratorio de Esteganografía LSB + CRC32
  const stegoInput = q<HTMLTextAreaElement>("#stego-secret-input");
  const stegoOutputEl = q<HTMLDivElement>("#stego-result");
  q<HTMLButtonElement>("#btn-stego-embed")?.addEventListener("click", () => {
    if (!stegoInput || !stegoOutputEl) return;
    const secret = stegoInput.value.trim();
    if (!secret) {
      stegoOutputEl.textContent = "Escribe un mensaje o prompt (hasta 5.000 caracteres) para incrustar.";
      return;
    }
    if (secret.length > MAX_PROMPT_CHARS) {
      stegoOutputEl.textContent = `El mensaje supera el máximo de ${MAX_PROMPT_CHARS} caracteres.`;
      return;
    }
    const byteLen = new TextEncoder().encode(secret).byteLength;
    const side = Math.max(96, Math.ceil(Math.sqrt(((byteLen + 32) * 8) / 3)));
    const carrier = new Uint8ClampedArray(side * side * 4);
    for (let i = 0; i < carrier.length; i += 4) {
      carrier[i] = 18 + ((i / 4) % 40);
      carrier[i + 1] = 42 + (Math.floor(i / (4 * side)) % 60);
      carrier[i + 2] = 88;
      carrier[i + 3] = 255;
    }
    const stegoData = embedPayloadInRGBA(carrier, secret);
    lastStegoBuffer = { data: stegoData, width: side, height: side };
    const crc = computeCRC32(new Uint8Array(stegoData.buffer, stegoData.byteOffset, stegoData.byteLength))
      .toString(16)
      .padStart(8, "0");
    stegoOutputEl.textContent = `Payload incrustado en matriz ${side}x${side} RGBA (${byteLen} bytes UTF-8 · CRC32 0x${crc}). Pulsa «Extraer y verificar» para comprobar la recuperación sin pérdidas.`;
  });

  q<HTMLButtonElement>("#btn-stego-extract")?.addEventListener("click", () => {
    if (!stegoOutputEl) return;
    if (!lastStegoBuffer) {
      stegoOutputEl.textContent = "Primero incrusta un mensaje para generar el portador RGBA en memoria.";
      return;
    }
    const extracted = extractPayloadFromRGBA(lastStegoBuffer.data);
    stegoOutputEl.textContent = extracted
      ? `Integridad CRC32 verificada · Mensaje recuperado (${extracted.length} caracteres): ${extracted.slice(0, 240)}${extracted.length > 240 ? "…" : ""}`
      : "Fallo de integridad CRC32: el portador fue alterado o no contiene cabecera QRP1.";
  });

  // Bóveda Cifrada Local (AES-256-GCM + SHA-256)
  const vaultListEl = q<HTMLUListElement>("#vault-list");
  const vaultStatusEl = q<HTMLParagraphElement>("#vault-status");

  function loadVault(): VaultEntry[] {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as VaultEntry[]) : [];
    } catch {
      return [];
    }
  }

  function saveVault(entries: VaultEntry[]): void {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(entries));
  }

  function renderVault(): void {
    if (!vaultListEl) return;
    const entries = loadVault();
    vaultListEl.innerHTML = "";
    if (entries.length === 0) {
      const empty = document.createElement("li");
      empty.className = "vault-item";
      empty.textContent = "Bóveda vacía. Guarda un QR del estudio para cifrarlo con AES-256-GCM.";
      vaultListEl.appendChild(empty);
      return;
    }
    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "vault-item";

      const info = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `${entry.mode.toUpperCase()} · ${entry.label}`;
      const br = document.createElement("br");
      const hashCode = document.createElement("code");
      hashCode.textContent = `SHA-256: ${entry.sha256.slice(0, 20)}…`;
      info.append(title, br, hashCode);

      const actions = document.createElement("div");
      actions.className = "btn-row";

      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.className = "btn btn-secondary";
      restoreBtn.textContent = "Descifrar";
      restoreBtn.addEventListener("click", async () => {
        try {
          const decrypted = await decryptVaultPayload(entry.cipher);
          const computedHash = await sha256Hex(decrypted);
          const valid = computedHash === entry.sha256;
          if (promptInput) {
            currentMode = "prompt";
            promptInput.value = decrypted;
            void renderQR();
          }
          if (vaultStatusEl) {
            vaultStatusEl.textContent = valid
              ? `Descifrado AES-256-GCM correcto e integridad SHA-256 verificada (${decrypted.length} caracteres).`
              : "Alerta: el hash SHA-256 no coincide.";
          }
        } catch {
          if (vaultStatusEl) vaultStatusEl.textContent = "No se pudo descifrar el registro.";
        }
      });

      actions.appendChild(restoreBtn);
      li.append(info, actions);
      vaultListEl.appendChild(li);
    });
  }

  q<HTMLButtonElement>("#btn-save-vault")?.addEventListener("click", async () => {
    const payload = resolveCurrentPayload();
    const sha256 = await sha256Hex(payload);
    const cipher = await encryptVaultPayload(payload);
    const entries = loadVault();
    entries.unshift({
      id: `qr_${Date.now()}`,
      mode: currentMode,
      label: payload.slice(0, 36) + (payload.length > 36 ? "…" : ""),
      payload: "[CIFRADO AES-256-GCM]",
      sha256,
      cipher,
      createdAt: new Date().toISOString(),
    });
    saveVault(entries.slice(0, 20));
    renderVault();
    if (vaultStatusEl) {
      vaultStatusEl.textContent = "QR cifrado con AES-256-GCM (IV 96 bits) y guardado localmente.";
    }
  });

  q<HTMLButtonElement>("#btn-export-vault")?.addEventListener("click", () => {
    const json = JSON.stringify(
      {
        application: "QR Pro Enterprise",
        exportedAt: new Date().toISOString(),
        entries: loadVault(),
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `qr-pro-portabilidad-${Date.now()}.json`);
    URL.revokeObjectURL(url);
  });

  q<HTMLButtonElement>("#btn-wipe-vault")?.addEventListener("click", () => {
    localStorage.removeItem(VAULT_STORAGE_KEY);
    localStorage.removeItem(VAULT_KEY_STORAGE);
    renderVault();
    if (vaultStatusEl) {
      vaultStatusEl.textContent = "Bóveda y clave AES-256 suprimidas permanentemente (Art. 17 RGPD).";
    }
  });

  // Cambio de tema Claro / Oscuro
  const themeBtn = q<HTMLButtonElement>("#theme-toggle-btn");
  themeBtn?.addEventListener("click", () => {
    const root = document.documentElement;
    const isLight = root.dataset.theme === "light";
    root.dataset.theme = isLight ? "dark" : "light";
    themeBtn.setAttribute("aria-pressed", isLight ? "false" : "true");
    themeBtn.textContent = isLight ? "Modo claro" : "Modo oscuro";
  });

  renderVault();
  void renderQR();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQRStudio);
  } else {
    initQRStudio();
  }
}
