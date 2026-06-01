# QR Pro Generator & Scanner - TODO

## Fase 1: Estructura Base y Navegación
- [x] Configurar navegación con 5 tabs (Generator, Scanner, History, Favorites, Settings)
- [x] Crear componentes base: Button, Card, Input, ColorPicker
- [x] Implementar tema oscuro/claro con persistencia
- [x] Configurar AsyncStorage para datos locales
- [x] Crear layout principal con SafeArea

## Fase 2: Generador de QR - Tipos de Contenido
- [x] Implementar generador de QR para Texto
- [x] Implementar generador de QR para URL/Enlace
- [x] Implementar generador de QR para Wi-Fi
- [x] Implementar generador de QR para Contacto (vCard)
- [x] Implementar generador de QR para Email
- [x] Implementar generador de QR para SMS
- [x] Implementar generador de QR para Teléfono
- [ ] Implementar generador de QR para Calendario
- [x] Implementar selector de tipos con interfaz intuitiva

## Fase 3: Pantalla de Vista Previa y Personalización
- [x] Crear pantalla de vista previa de QR
- [x] Implementar selector de colores (primario y fondo)
- [ ] Implementar selector de tamaño/escala
- [ ] Implementar selector de formato (PNG, JPG, SVG)
- [x] Agregar opción de descargar QR
- [x] Agregar opción de compartir QR
- [ ] Agregar opción de copiar al portapapeles
- [x] Agregar opción de guardar a favoritos

## Fase 4: Escáner de QR
- [ ] Integrar expo-camera para captura
- [ ] Implementar detección de códigos QR
- [ ] Crear interfaz de escáner con overlay
- [ ] Mostrar resultado del escaneo
- [ ] Agregar opción de abrir URL detectada
- [ ] Agregar opción de copiar contenido
- [ ] Guardar escaneos en historial automáticamente

## Fase 5: Historial y Favoritos
- [x] Crear pantalla de historial con tabs (Generados/Escaneados)
- [x] Implementar almacenamiento de historial en AsyncStorage
- [x] Agregar búsqueda/filtrado en historial
- [x] Crear pantalla de favoritos
- [x] Implementar funcionalidad de marcar como favorito
- [x] Agregar opciones de eliminar items
- [ ] Mostrar detalles de QR guardado
- [ ] Agregar opción de regenerar QR

## Fase 6: Configuración y Personalización
- [ ] Crear pantalla de Settings
- [ ] Implementar selector de tema (Light/Dark/Auto)
- [ ] Agregar configuración de colores por defecto
- [ ] Agregar configuración de formato de descarga por defecto
- [ ] Implementar limpieza de historial
- [ ] Agregar información de la app (versión, créditos)
- [ ] Implementar permisos de cámara

## Fase 7: Funcionalidades Avanzadas
- [ ] Exportar historial como CSV/JSON
- [ ] Importar QR desde archivo
- [ ] Generar código de barras (además de QR)
- [ ] Agregar códigos QR con logo personalizado
- [ ] Implementar corrección de errores (niveles L, M, Q, H)
- [ ] Agregar estadísticas de uso
- [ ] Implementar atajos rápidos para tipos frecuentes
- [ ] Agregar vista de galería de QR generados

## Fase 8: Pulido y Optimización
- [ ] Optimizar rendimiento de generación de QR
- [ ] Mejorar transiciones y animaciones
- [ ] Validar flujos de usuario completos
- [ ] Pruebas en dispositivos reales
- [ ] Optimizar tamaños de imagen
- [ ] Mejorar accesibilidad (VoiceOver, TalkBack)
- [ ] Agregar mensajes de error descriptivos
- [ ] Crear iconos personalizados para la app

## Fase 9: Branding y Entrega
- [x] Generar logo personalizado de la app
- [x] Actualizar app.config.ts con información de branding
- [ ] Crear checkpoint final
- [ ] Preparar para publicación en Google Play Store
- [ ] Documentar características principales

## Nuevas Características Solicitadas
- [ ] Generador de QR para Calendario (con fecha, hora y ubicación)
- [ ] Integración con DateTimePicker para seleccionar fecha y hora
- [ ] Validación de fechas y horas
- [ ] Soporte para eventos recurrentes (opcional)

## Características Avanzadas - Colores, Formatos y Dibujos
- [x] Exportar QR en múltiples formatos (PNG, JPG, SVG)
- [x] Paletas de colores predefinidas (Neon, Pastel, Monocromático, etc.)
- [x] Agregar logo/imagen en el centro del QR
- [x] Marcos decorativos alrededor del QR
- [x] Patrones de fondo personalizados
- [x] Esquinas redondeadas en el QR
- [ ] Efectos de gradiente en colores
- [x] Presets de estilos (Clásico, Moderno, Artístico)
