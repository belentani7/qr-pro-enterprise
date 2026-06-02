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

## Características de Dibujos y Formas Atractivas
- [x] Generador de QR con formas geométricas (cuadrados, círculos, diamantes)
- [x] Patrones decorativos (flores, estrellas, copos de nieve)
- [ ] Marcos artísticos (vintage, moderno, minimalista)
- [ ] Gradientes y efectos de color
- [ ] Iconos personalizados en el centro
- [ ] Animaciones de generación

## Procesos en Segundo Plano
- [ ] Generación de QR en background thread
- [ ] Caché de QR generados
- [ ] Sincronización de historial en background
- [ ] Notificaciones de descarga completada
- [x] Procesamiento de imágenes optimizado

## Protección de Código y Originalidad
- [x] Encriptación de datos locales (AsyncStorage)
- [x] Hash único para cada QR generado
- [x] Watermark invisible en QR
- [x] Protección contra copia de datos
- [x] Validación de integridad de QR

## Cumplimiento de Seguridad Europea (GDPR/RGPD)
- [x] Política de privacidad integrada
- [x] Consentimiento de datos explícito
- [x] Opción de eliminar todos los datos
- [x] No recopilar datos personales innecesarios
- [x] Encriptación de datos en tránsito
- [x] Derecho al olvido (borrar historial)
- [x] Transparencia en recopilación de datos
- [x] Auditoría de seguridad local

## QR con Formas Personalizadas (Animales, Objetos, Letras, Símbolos)
- [x] Generador de QR con forma de animal (perro, gato, pájaro, etc.)
- [x] Generador de QR con forma de objeto (corazón, estrella, círculo, etc.)
- [x] Generador de QR con forma de letra o número personalizado
- [x] Generador de QR con símbolo personalizado
- [x] Selector de formas predefinidas (10+ opciones)
- [x] Generador de formas por descripción de texto (IA)
- [x] Carga de foto personalizada para generar forma

## QR Invisible en Imagen
- [x] Carga de imagen común (foto, ilustración, etc.)
- [x] Incrustación de QR invisible en imagen
- [x] Ajuste de opacidad del QR (0-100%)
- [x] Posicionamiento del QR en la imagen
- [x] Técnica de esteganografía (LSB - Least Significant Bit)
- [x] Preservación de calidad de imagen original
- [ ] Extracción de QR invisible desde imagen
- [ ] Validación de QR incrustado

## Procesamiento de Imágenes Avanzado
- [x] Redimensionamiento inteligente de imagen
- [x] Compresión sin pérdida
- [x] Ajuste de contraste y brillo
- [x] Filtros de imagen (blanco/negro, sepia, etc.)
- [x] Detección de bordes para mejor incrustación
- [x] Análisis de histograma de imagen
