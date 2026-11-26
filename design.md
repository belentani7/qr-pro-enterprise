# Diseño de Interfaz - QR Pro Generator & Scanner

## Orientación y Principios
- **Orientación**: Portrait (9:16)
- **Uso**: Una mano
- **Estilo**: iOS-first, siguiendo Apple Human Interface Guidelines
- **Paleta**: Colores modernos y accesibles

## Lista de Pantallas

1. **Home / Generator** - Pantalla principal de generación de QR
2. **QR Types** - Selector de tipos de contenido para QR
3. **Text Generator** - Generador de QR para texto simple
4. **URL Generator** - Generador de QR para enlaces
5. **WiFi Generator** - Generador de QR para conexión Wi-Fi
6. **Contact Generator** - Generador de QR para contactos (vCard)
7. **Email Generator** - Generador de QR para correo electrónico
8. **SMS Generator** - Generador de QR para SMS
9. **QR Preview** - Vista previa del QR generado con opciones de descarga/compartir
10. **Scanner** - Escáner de códigos QR
11. **History** - Historial de QR generados y escaneados
12. **Favorites** - QR favoritos guardados
13. **Settings** - Configuración de colores, tema y preferencias
14. **QR Details** - Detalles de un QR guardado

## Flujos Principales de Usuario

### Flujo 1: Generar QR Simple
1. Usuario abre la app → Home
2. Toca "Generar QR" → QR Types
3. Selecciona tipo (Texto, URL, etc.)
4. Ingresa contenido → Preview
5. Personaliza colores (opcional)
6. Descarga, comparte o guarda a favoritos

### Flujo 2: Escanear QR
1. Usuario toca "Escáner" en tab bar
2. Cámara se abre
3. Apunta a QR → Detecta automáticamente
4. Muestra resultado (URL, texto, etc.)
5. Opción de abrir, copiar o guardar

### Flujo 3: Consultar Historial
1. Usuario toca "Historial" en tab bar
2. Ve lista de QR generados/escaneados
3. Toca un item → Detalles
4. Opciones: Regenerar, Compartir, Eliminar, Marcar como favorito

## Contenido Específico por Pantalla

### Home Screen
- **Header**: Logo + Título "QR Pro"
- **Contenido Principal**:
  - Botón grande "Generar QR" (primario)
  - Botón "Escanear QR" (secundario)
  - Accesos rápidos a tipos frecuentes (Texto, URL, Wi-Fi)
- **Bottom Tab Bar**: Generator, Scanner, History, Favorites, Settings

### QR Types Screen
- **Grid de 2 columnas** con tipos disponibles:
  - Texto
  - URL / Enlace
  - Wi-Fi
  - Contacto (vCard)
  - Email
  - SMS
  - Calendario
  - Ubicación (Mapa)
  - Teléfono
  - Código de barras
- Cada tipo con icono descriptivo

### Text/URL/WiFi Generator Screens
- **Campo de entrada**: Adaptado al tipo
  - Texto: MultilineTextInput
  - URL: TextInput con validación
  - WiFi: Campos para SSID, Contraseña, Tipo de seguridad
- **Vista previa en tiempo real**: QR pequeño a la derecha
- **Botones de acción**:
  - Personalizar (colores)
  - Descargar
  - Compartir
  - Guardar a favoritos

### QR Preview Screen
- **QR Grande**: Centrado, escalable
- **Información**: Tipo, contenido, tamaño
- **Opciones de Personalización**:
  - Color principal (módulos)
  - Color de fondo
  - Tamaño
  - Formato (PNG, JPG, SVG)
- **Botones de Acción**:
  - Descargar
  - Compartir
  - Copiar al portapapeles
  - Guardar a favoritos
  - Volver

### Scanner Screen
- **Cámara fullscreen** con overlay
- **Indicador de escaneo**: Marco animado
- **Resultado**: Overlay con información detectada
- **Opciones**:
  - Abrir URL
  - Copiar texto
  - Guardar a historial
  - Compartir

### History Screen
- **Tabs**: Generados | Escaneados
- **Lista**: Items con:
  - Miniatura del QR / Icono del tipo
  - Contenido (primeras líneas)
  - Fecha/hora
  - Acciones rápidas (Copiar, Eliminar, Favorito)
- **Búsqueda**: Campo para filtrar por contenido
- **Ordenamiento**: Más recientes primero

### Settings Screen
- **Tema**: Light / Dark / Auto
- **Personalización de QR**:
  - Color principal (Picker)
  - Color de fondo (Picker)
  - Tamaño por defecto
  - Formato de descarga
- **Privacidad**:
  - Limpiar historial
  - Exportar datos
  - Permisos de cámara
- **Información**:
  - Versión de la app
  - Créditos

## Elecciones de Color

| Elemento | Color Light | Color Dark | Uso |
|----------|-------------|-----------|-----|
| Primary | #0066CC | #0099FF | Botones, acciones principales |
| Background | #FFFFFF | #0F0F0F | Fondo de pantalla |
| Surface | #F5F5F5 | #1A1A1A | Tarjetas, superficies elevadas |
| Foreground | #000000 | #FFFFFF | Texto principal |
| Muted | #666666 | #999999 | Texto secundario |
| Border | #E0E0E0 | #333333 | Bordes, divisores |
| Success | #34C759 | #30B0C0 | Confirmaciones |
| Warning | #FF9500 | #FFB84D | Advertencias |
| Error | #FF3B30 | #FF6B6B | Errores |

## Componentes Reutilizables

- **Button**: Primary, Secondary, Tertiary
- **Card**: Con sombra y borde
- **Input**: TextInput, MultilineInput, Picker
- **QRDisplay**: Componente para mostrar QR
- **ColorPicker**: Selector de colores
- **HistoryItem**: Item de lista para historial
- **TabBar**: Navegación inferior con 5 tabs

## Consideraciones de Accesibilidad

- Tamaños de toque mínimos: 44x44pt
- Contraste de colores: WCAG AA (4.5:1 para texto)
- Labels accesibles para todos los elementos interactivos
- Soporte para VoiceOver (iOS) y TalkBack (Android)
