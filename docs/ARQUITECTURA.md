

<!-- repo-forge:docs-arquitectura:inicio -->
# Arquitectura

## Tipo

aplicación web con build (Next/Vite/Expo)

## Piezas observadas

| Pieza | Evidencia |
|---|---|
| Lenguajes | YAML 49.8%, TypeScript 34.0%, Markdown 8.0%, HTML 3.5%, JSON 2.7%, JavaScript 1.6% |
| Puntos de entrada | ninguno detectado |
| Páginas HTML | 3 |
| Tests | 3 archivos |
| Dependencias de paquete | 50 |

## Capas propuestas

```text
contenido/      datos y textos versionados
plataforma/     ficha, diseño y contrato del producto
brand/          tokens, marca y activos
scripts/        verificación y operación
tests/          pruebas ejecutables
```

La propuesta no mueve archivos existentes: describe dónde debe vivir lo nuevo para que
el repositorio siga siendo legible.

## Deuda declarada

- 6 lenguajes: coste de contexto alto.

<!-- repo-forge:arquitectura -->
<!-- repo-forge:docs-arquitectura:fin -->
