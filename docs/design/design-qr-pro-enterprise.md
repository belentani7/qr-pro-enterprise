# SDD / Design Doc -- qr-pro-enterprise
Fecha: 2026-09-25 | Estado: Draft

## Arquitectura general

Stack: Node.js, React, Tailwind, Express, TypeScript. Estructura de primer nivel detectada:

```
  .github
  .gitignore
  .gitkeep
  .npmrc
  .watchmanconfig
  README.md
  app
  app.config.ts
  assets
  audit_extreme_6x10.md
  babel.config.js
  components
  constants
  design.md
  drizzle
  drizzle.config.ts
  eslint.config.js
  global.css
  hooks
  lib
```

CI: ci.yml.

## Decisiones clave

Ver `docs/adr/`. Regla: una fuente de verdad por concern, contratos de frontera
claros y direccion de dependencias sin ciclos.

## Flujos criticos

1. Desarrollo local -> build -> test -> CI.
2. Cambio -> PR -> revision -> merge -> deploy (si aplica).

## Estrategia de verificacion

- Build y tests en CI en cada PR.
- Revision de seguridad (cero secretos, validacion).
- Comprobacion de deploy segun la matriz de plataforma.

## Limites y riesgos

- Deuda tecnica no documentada: registrar como ADR antes de refactor mayor.
- Dependencias externas: fijar versiones y lockfile.
