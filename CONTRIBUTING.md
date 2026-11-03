# Contribuir

## Flujo

1. Abre un issue describiendo el problema o la propuesta.
2. Crea una rama corta: `feat/...`, `fix/...` o `docs/...`.
3. Aplica el protocolo spec-first y añade tests.
4. Ejecuta la verificación local.
5. Abre un PR completando la checklist de `.github/pull_request_template.md`.

## Comandos

- `dev`: `concurrently -k "pnpm dev:server" "pnpm dev:metro"`
- `dev:server`: `cross-env NODE_ENV=development tsx watch server/_core/index.ts`
- `dev:metro`: `cross-env EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --web --port ${EXPO_PORT:-8081}`
- `build`: `esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
- `start`: `NODE_ENV=production node dist/index.js`
- `check`: `tsc --noEmit`
- `lint`: `expo lint`
- `format`: `prettier --write .`
- `test`: `vitest run`
- `db:push`: `drizzle-kit generate && drizzle-kit migrate`
- `android`: `expo start --android`
- `ios`: `expo start --ios`
- `qr`: `node scripts/generate_qr.mjs`

## Reglas

- Conventional commits.
- Sin secretos ni credenciales.
- Un cambio reversible por PR.
- Revisión de `@belentani7` y CI verde.
