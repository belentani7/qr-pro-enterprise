# Contribuir a QR Pro Enterprise

## Antes de empezar

1. Lee `BIBLIA.md` (doctrina del repositorio) y `plataforma/FICHA.md` (alcance funcional y de producto).
2. Ejecuta `pnpm run doctor` (o `python3 scripts/doctor.py`) y `pnpm test` para verificar la línea base.
3. Cada cambio debe resolver un único objetivo verificable con pruebas automatizadas.

## Flujo de trabajo

1. Abre un issue describiendo el problema o la mejora con pasos reproducibles.
2. Crea una rama corta (`feat/...`, `fix/...`, `perf/...`, `docs/...`).
3. Implementa el cambio respetando tipado estricto (`pnpm run check`) y linter (`pnpm run lint`).
4. Añade pruebas unitarias o E2E en `tests/` y verifica con `pnpm test` y `pnpm run audit`.
5. Abre un Pull Request completando la lista de verificación de `.github/pull_request_template.md`.

## Comandos principales

- `pnpm dev` — Levanta servidor Express/tRPC y Metro Web en paralelo.
- `pnpm run build` — Compila el servidor de producción (`dist/index.js`) y exporta activos web.
- `pnpm run build:web` — Exporta la aplicación Expo Web optimizada (`dist/web`).
- `pnpm run check` — Verificación de tipos TypeScript (`tsc --noEmit`).
- `pnpm run lint` — Análisis estático con ESLint (`expo lint`).
- `pnpm test` — Ejecuta la suite completa de Vitest (unitarios, accesibilidad y E2E).
- `pnpm run qr -- --help` — Herramienta CLI empresarial de generación y validación de códigos QR.
- `pnpm run audit` — Auditoría automatizada de rendimiento, bundles, activos y WCAG 2.1 AA.
- `pnpm run doctor` — Verificación estructural del repositorio (`scripts/doctor.py`).

## Reglas innegociables

- Conventional Commits (`feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`).
- Cero secretos, tokens o datos reales de clientes en el repositorio.
- Cero placeholders (`TODO` sin implementar o funciones simuladas).
- Ninguna promesa documental que el código no cumpla de forma verificable.
