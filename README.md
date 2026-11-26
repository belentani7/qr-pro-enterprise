# QR Pro Enterprise

Plataforma empresarial full-stack y multiplataforma (**Web Edge + API Node/tRPC + Expo React Native**) para la generación vectorial 100 % local de códigos QR conforme a **ISO/IEC 18004**, soporte extendido de prompts y documentos de hasta **5.000 caracteres** mediante encadenado multi-QR automático, esteganografía LSB con suma de verificación **CRC32 (IEEE 802.3)**, decodificación óptica local con **jsQR** y bóveda privada cifrada con **Web Crypto AES-256-GCM + SHA-256**.

Consulta la ficha institucional y de catálogo en [`plataforma/FICHA.md`](plataforma/FICHA.md) y el prompt operativo canónico de hasta 5.000 caracteres en [`PROMPT-AGENTE-5000.md`](PROMPT-AGENTE-5000.md).

---

## Capacidades principales

| Módulo | Ruta principal | Descripción verificada |
|---|---|---|
| Motor QR Vectorial y PNG | `lib/qr-engine.ts` | Renderizado 100 % local (`qrcode@1.5.4`) con formas modulares (`square`, `rounded`, `circle`, `diamond`, `organic`), esquinas personalizables, emblema central con nivel `H` (~30 %) y constructores RFC (`WIFI:`, `VCARD 3.0`, `mailto:`, `SMSTO:`, `tel:`, `https://`). |
| Prompts y Textos hasta 5.000 caracteres | `lib/qr-engine.ts`, `client/qr-studio.ts`, `app/generator-*.tsx` | Admite entradas de `1` a `5.000` caracteres. Cuando la carga supera el límite físico binario de un único símbolo QR Versión 40-L (`2.953` bytes), fragmenta automáticamente por puntos de código UTF-8 en partes `[QRP i/N]` y las reensambla sin pérdidas. |
| Decodificador Óptico Local | `lib/qr-engine.ts`, `app/(tabs)/scanner.tsx` | Escaneo en memoria mediante `jsqr@1.4.0` (incluyendo inversión cromática) sin enviar capturas a servidores externos. |
| Esteganografía LSB + CRC32 | `lib/image-steganography-service.ts` | Incrusta cargas de hasta 5.000 caracteres en los bits menos significativos RGB con cabecera mágica `QRP1`, longitud `uint32` y verificación de integridad IEEE 802.3 CRC32. |
| Criptografía y Controles RGPD | `lib/security-service.ts`, `app/privacy-settings.tsx` | Cifrado autenticado `AES-256-GCM` (IV aleatorio de 96 bits), hashes `SHA-256` deterministas, exportación JSON de portabilidad (Art. 20 RGPD) y supresión criptográfica local (Art. 17 RGPD). |
| Estudio Web + Capa GPU WebGL | `index.html`, `hero.js`, `assets/studio.css`, `client/qr-studio.ts` | Interfaz semántica HTML5 con Container Queries (`@container`), auditoría WCAG 2.1 AA en vivo y campo óptico GLSL WebGL2/WebGL1 a 60 fps con pausa fuera de pantalla, respeto a `prefers-reduced-motion` y fallback Canvas 2D. |
| API Backend Express + tRPC | `server/_core/index.ts`, `server/routers.ts` | Endpoints validados con Zod (`qr.generate`, `qr.contrast`, `qr.reassemble`, `POST /api/qr/generate`, `GET /api/health`) escuchando en `0.0.0.0`. |

---

## Requisitos e instalación

- **Node.js** `>= 20` y **pnpm** `9.x` (`corepack enable`)
- **Python** `>= 3.11` (para `scripts/doctor.py`)

```bash
corepack pnpm install
```

---

## Comandos de desarrollo, compilación y verificación

```bash
# 1. Doctor estructural y validación de catálogo
corepack pnpm run doctor

# 2. Verificación estricta de tipos TypeScript (strict: true)
corepack pnpm run check

# 3. Linter ESLint / Expo
corepack pnpm run lint

# 4. Suite automatizada (Unitarios + Integración HTTP/tRPC + Accesibilidad WCAG 2.1 AA axe-core)
corepack pnpm test

# 5. Build de producción (API dist/index.js + Estudio estático dist/public/)
corepack pnpm run build

# 6. Exportación completa Expo Web (React Native Web)
corepack pnpm run build:expo-web

# 7. Auditoría técnica de higiene, bundles y límite de 5.000 caracteres
corepack pnpm run audit
```

---

## Herramientas CLI internas (`scripts/`)

Ambas utilidades disponen de bandera `--help` con código de salida `0`:

### 1. Generador QR por línea de comandos (`scripts/generate_qr.mjs`)

```bash
# Ver ayuda completa
node scripts/generate_qr.mjs --help

# Generar QR vectorial SVG con corrección Reed-Solomon nivel H
node scripts/generate_qr.mjs "https://github.com/belentani7/qr-pro-enterprise" --format svg --ecc H --dark "#0F172A" --out qr-corporativo.svg

# Procesar lote desde archivo de texto o JSON (admite entradas de hasta 5.000 caracteres)
node scripts/generate_qr.mjs --batch entradas.txt --format svg --outdir salida-lote
```

### 2. Auditor técnico (`scripts/audit.mjs`)

```bash
node scripts/audit.mjs --help
node scripts/audit.mjs --json
```

---

## Despliegue en Vercel y Servidor Node

- **Vercel Edge Estático (`vercel.json`)**: ejecuta `pnpm run build` y publica `dist/public` con cabeceras de seguridad (`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` y caché inmutable para `/assets/*`).
- **Servidor Full-Stack Node**: ejecuta `pnpm run build && pnpm start` (escucha en `0.0.0.0:${PORT:-3000}` sirviendo tanto `dist/public` como `/api/trpc`, `/api/qr/generate` y `/api/health`).

## Licencia

Distribuido bajo licencia [MIT](LICENSE).
