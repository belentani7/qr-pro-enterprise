import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { QRDisplay } from "@/components/qr-display";
import { ColorPaletteSelector, PREDEFINED_PALETTES, type ColorPalette } from "@/components/color-palette-selector";
import { FormatSelector, type QRFormat } from "@/components/format-selector";
import { QRStyleSelector, QR_STYLES, type QRStyle } from "@/components/qr-style-selector";
import { useQRGenerator } from "@/hooks/use-qr-generator";
import { useQRStorage } from "@/hooks/use-qr-storage";
import { MAX_PROMPT_CHARS, type MultiQRPart, type QRModuleShape } from "@/lib/qr-engine";
import { saveQRDataUrl, shareOrExportQRDataUrl } from "@/lib/file-export";

function styleToModuleShape(style: QRStyle): QRModuleShape {
  if (style.shadow) return "diamond";
  if (style.border) return "circle";
  if (style.roundedCorners) return "rounded";
  return "square";
}

export default function GeneratorTextAdvancedScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [content, setContent] = useState("");
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(PREDEFINED_PALETTES[0]);
  const [selectedFormat, setSelectedFormat] = useState<QRFormat>("SVG");
  const [selectedStyle, setSelectedStyle] = useState<QRStyle>(QR_STYLES[0]);
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [parts, setParts] = useState<MultiQRPart[]>([]);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGenerateQR = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Por favor ingresa un texto o prompt");
      return;
    }

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const format = selectedFormat === "SVG" ? "svg" : "png";
    const result = await generateQR(content, {
      width: 320,
      format,
      moduleShape: styleToModuleShape(selectedStyle),
      color: {
        dark: selectedPalette.dark,
        light: selectedPalette.light,
      },
    });

    if (result) {
      setQrData(result.dataUrl);
      setParts(result.parts ?? []);
      setActivePartIndex(0);
    }
  };

  const displayedDataUrl = parts[activePartIndex]?.dataUrl ?? qrData;

  const handleDownload = async () => {
    if (!displayedDataUrl) return;
    const ext = displayedDataUrl.startsWith("data:image/svg") ? "svg" : selectedFormat.toLowerCase();
    const res = await saveQRDataUrl(displayedDataUrl, `QR_Avanzado_${Date.now()}.${ext}`);
    Alert.alert("Exportado", `QR guardado como ${res.fileName}`);
  };

  const handleShare = async () => {
    if (!displayedDataUrl) return;
    const ext = displayedDataUrl.startsWith("data:image/svg") ? "svg" : selectedFormat.toLowerCase();
    await shareOrExportQRDataUrl(displayedDataUrl, `QR_Avanzado_${Date.now()}.${ext}`, "Compartir QR");
  };

  const handleSaveToHistory = async () => {
    if (!displayedDataUrl || !content.trim()) return;

    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await addToHistory({
      type: "generated",
      qrType: "Texto Avanzado",
      content,
      dataUrl: displayedDataUrl,
      isFavorite,
      customColors: {
        dark: selectedPalette.dark,
        light: selectedPalette.light,
      },
    });

    Alert.alert("Guardado", "QR añadido al historial");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">Generar QR Avanzado</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-2">
            Texto o Prompt Extendido (hasta {MAX_PROMPT_CHARS} caracteres)
          </Text>
          <TextInput
            placeholder="Escribe aquí hasta 5.000 caracteres..."
            placeholderTextColor={colors.muted}
            value={content}
            onChangeText={setContent}
            maxLength={MAX_PROMPT_CHARS}
            multiline
            numberOfLines={5}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              color: colors.foreground,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 12,
              fontSize: 16,
            }}
          />
          <Text className="text-muted text-xs mt-2">
            {content.length} / {MAX_PROMPT_CHARS} caracteres
          </Text>
        </View>

        {parts.length > 1 && (
          <View className="mb-4 bg-surface rounded-xl p-3 border border-border gap-2">
            <Text className="text-foreground font-semibold text-xs">
              Secuencia multi-QR ({parts.length} partes escaneables)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {parts.map((part, idx) => (
                <TouchableOpacity
                  key={part.index}
                  onPress={() => setActivePartIndex(idx)}
                  style={{
                    backgroundColor: activePartIndex === idx ? colors.primary : colors.background,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="px-3 py-1.5 rounded-lg"
                >
                  <Text
                    style={{ color: activePartIndex === idx ? "white" : colors.foreground }}
                    className="text-xs font-semibold"
                  >
                    Parte {part.index}/{part.total}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View className="mb-6 items-center">
          <QRDisplay
            dataUrl={displayedDataUrl}
            loading={loading}
            error={error}
            onDownload={() => void handleDownload()}
            onShare={() => void handleShare()}
            onFavorite={() => setIsFavorite(!isFavorite)}
            isFavorite={isFavorite}
            size={250}
          />
        </View>

        {!qrData && (
          <TouchableOpacity
            onPress={() => void handleGenerateQR()}
            disabled={loading || !content.trim()}
            accessibilityRole="button"
            style={{
              backgroundColor: colors.primary,
              opacity: loading || !content.trim() ? 0.5 : 1,
            }}
            className="py-4 rounded-xl items-center mb-6 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Generar QR</Text>
          </TouchableOpacity>
        )}

        {qrData && (
          <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-6">
            <ColorPaletteSelector
              selectedPalette={selectedPalette}
              onSelectPalette={setSelectedPalette}
            />
            <FormatSelector selectedFormat={selectedFormat} onSelectFormat={setSelectedFormat} />
            <QRStyleSelector selectedStyle={selectedStyle} onSelectStyle={setSelectedStyle} />

            <TouchableOpacity
              onPress={() => void handleGenerateQR()}
              accessibilityRole="button"
              style={{ backgroundColor: colors.primary }}
              className="py-3 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-white font-semibold text-sm">Actualizar QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {qrData && (
          <TouchableOpacity
            onPress={() => void handleSaveToHistory()}
            accessibilityRole="button"
            style={{ backgroundColor: colors.success }}
            className="py-4 rounded-xl items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Guardar en historial</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
