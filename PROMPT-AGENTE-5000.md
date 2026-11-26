# PROMPT OPERATIVO — QR PRO ENTERPRISE
### Documento canónico de autoinstrucción y reconstrucción (Base44 / Agente) · <= 5.000 caracteres · v2.0

---

## 0. IDENTIDAD Y PROPÓSITO DEL PRODUCTO
Trabaja sobre **QR Pro Enterprise** (`belentani7/qr-pro-enterprise`, proyecto Vercel `prj_kTCvbxF0tNrWXjKP4LOl94Y9oyfQ`). NO crees un repositorio nuevo ni sustituyas el estudio funcional por una plantilla SaaS vacía. Es una plataforma empresarial híbrida (Web estática Edge + API Express/tRPC + App móvil Expo SDK 54 / React Native 0.81) dedicada a generación vectorial de códigos QR ISO/IEC 18004, soporte de prompts extendidos de hasta **5.000 caracteres**, esteganografía LSB con CRC32, decodificación óptica local `jsQR` y bóveda cifrada en dispositivo.

Regla cero: **verificar antes de afirmar**. Prohibido introducir placeholders, botones sin acción, secretos en código, telemetría silenciosa o llamadas por defecto a terceros que filtren el contenido del usuario.

## 1. ARQUITECTURA Y MÓDULOS OBLIGATORIOS
1. **Motor QR Local (`lib/qr-engine.ts`)**:
   - Generación 100% local en SVG vectorial (`generateLocalQRSVG`) y PNG (`generateLocalQRPngDataUrl`) sobre `qrcode@1.5.4`.
   - Geometrías modulares reales: `square`, `rounded`, `circle`, `diamond`, `organic`; esquinas `square`, `rounded`, `circle`; emblema central forzando Reed-Solomon nivel `H` (~30%).
   - Constructores tipados con escape estricto: URL HTTPS, Wi-Fi (`WIFI:`), contacto `vCard 3.0`, `mailto:`, `SMSTO:` y `tel:`.
   - Auditoría de luminancia relativa y contraste **WCAG 2.1 §1.4.3** (`calculateContrastRatio`), alertando si el ratio baja de `4.5:1` o si los colores están invertidos.
2. **Soporte de Prompts y Textos de hasta 5.000 Caracteres (`MAX_PROMPT_CHARS = 5000`)**:
   - Todo campo de prompt o texto avanzado admite hasta **5.000 caracteres** con contador en vivo (`X / 5000`).
   - Como un único símbolo binario ISO/IEC 18004 Versión 40-L admite máximo `2.953` bytes UTF-8, `splitPayloadForMultiQR` y `generateMultiPartQRSVG` encadenan automáticamente cargas mayores en partes `[QRP i/N]` sin cortar puntos de código UTF-8, y `reassembleMultiQRPayloads` reconstruye los 5.000 caracteres exactos al escanear.
3. **Esteganografía LSB + IEEE 802.3 CRC32 (`lib/image-steganography-service.ts`)**:
   - Cabecera binaria `QRP1` + longitud `uint32` big-endian + payload UTF-8 (hasta 5.000 caracteres) + CRC32 en los bits menos significativos RGB (`embedPayloadInRGBA` / `extractPayloadFromRGBA`), detectando cualquier alteración de 1 bit.
   - Derivación determinista de estilo y color desde prompts semánticos de hasta 5.000 caracteres (`generateShapeFromDescription`).
4. **Criptografía y Privacidad RGPD / LOPDGDD (`lib/security-service.ts`)**:
   - Web Crypto API estándar (`crypto.subtle`): integridad determinista **SHA-256** (`generateQRHash` / `validateQRIntegrity`) y cifrado autenticado **AES-256-GCM** con IV aleatorio CSPRNG de 96 bits (12 bytes) y clave aleatoria por dispositivo.
   - Ejercicio real de derechos: portabilidad JSON estructurada (Art. 20 RGPD) y supresión total de claves e historial (Art. 17 RGPD). Nunca declarar certificaciones jurídicas externas no auditadas.
5. **Estudio Web + Capa GPU WebGL (`index.html`, `client/qr-studio.ts`, `assets/studio.css`, `hero.js`)**:
   - HTML5 semántico (`header`, `nav`, `main#contenido`, `aside`, `footer`), CSS Grid, Flexbox, Custom Properties y `@container` Container Queries.
   - `hero.js`: shader GLSL WebGL2/WebGL1 de matriz óptica a 60 fps (1 draw call, DPR <= 1.75), sincronizado con la paleta activa, pausa automática con `IntersectionObserver` y `visibilitychange`, respeto a `prefers-reduced-motion: reduce` y degradación automática a Canvas 2D / CSS.
6. **Backend y CLI (`server/`, `scripts/`)**:
   - Express + tRPC (`qr.generate`, `qr.contrast`, `qr.reassemble`) + `POST /api/qr/generate` y `GET /api/health` escuchando en `0.0.0.0`.
   - Herramientas CLI con `--help` funcional: `node scripts/generate_qr.mjs` (PNG/SVG/UTF8, lotes y secuencias 5K) y `node scripts/audit.mjs` (`--json`).

## 2. PUERTAS DE CALIDAD Y DESPLIEGUE
Antes de abrir PR o fusionar en `main`, todos los comandos deben terminar con código `0`:
1. `pnpm run doctor` (`scripts/doctor.py` 41/41 + `scripts/validate-catalog.mjs`).
2. `pnpm run check` (`tsc --noEmit` con `strict: true`, cero errores y cero `as any`).
3. `pnpm run lint` (`expo lint` limpio).
4. `pnpm test` (suite Vitest: motor QR, secuencias de 5.000 caracteres, esteganografía CRC32, AES-256-GCM, E2E HTTP/tRPC y accesibilidad WCAG 2.1 AA con `axe-core`).
5. `pnpm run build && pnpm run audit` (genera `dist/index.js` y `dist/public/` para Vercel `outputDirectory: "dist/public"` sin `builds`/`routes` obsoletos en `vercel.json`).
