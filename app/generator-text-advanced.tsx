import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { QRDisplay } from "@/components/qr-display";
import { ColorPaletteSelector, PREDEFINED_PALETTES, type ColorPalette } from "@/components/color-palette-selector";
import { FormatSelector, type QRFormat } from "@/components/format-selector";
import { QRStyleSelector, QR_STYLES, type QRStyle } from "@/components/qr-style-selector";
import { useQRGenerator } from "@/hooks/use-qr-generator";
import { useQRStorage } from "@/hooks/use-qr-storage";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

export default function GeneratorTextAdvancedScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [content, setContent] = useState("");
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(PREDEFINED_PALETTES[0]);
  const [selectedFormat, setSelectedFormat] = useState<QRFormat>("PNG");
  const [selectedStyle, setSelectedStyle] = useState<QRStyle>(QR_STYLES[0]);
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGenerateQR = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Por favor ingresa un texto");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await generateQR(content, {
      width: 300,
      color: {
        dark: selectedPalette.dark,
        light: selectedPalette.light,
      },
    });

    if (result) {
      setQrData(result.dataUrl);
    }
  };

  const handleDownload = async () => {
    if (!qrData) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const fileName = `QR_${Date.now()}.${selectedFormat.toLowerCase()}`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const base64Data = qrData.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert("Éxito", `QR guardado como ${fileName}`);
    } catch (err) {
      Alert.alert("Error", "No se pudo descargar el QR");
    }
  };

  const handleShare = async () => {
    if (!qrData) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Sharing.shareAsync(qrData, {
        mimeType: "image/png",
        dialogTitle: "Compartir QR",
      });
    } catch (err) {
      console.error("Error compartiendo:", err);
    }
  };

  const handleSaveToHistory = async () => {
    if (!qrData || !content.trim()) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addToHistory({
      type: "generated",
      qrType: "Texto",
      content,
      dataUrl: qrData,
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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">Generar QR Avanzado</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-2">Ingresa tu texto</Text>
          <TextInput
            placeholder="Escribe aquí..."
            placeholderTextColor={colors.muted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              color: colors.foreground,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 12,
              fontFamily: "System",
              fontSize: 16,
            }}
          />
          <Text className="text-muted text-xs mt-2">{content.length} caracteres</Text>
        </View>

        {/* QR Preview */}
        <View className="mb-6 items-center">
          <QRDisplay
            dataUrl={qrData}
            loading={loading}
            error={error}
            onDownload={handleDownload}
            onShare={handleShare}
            onFavorite={() => setIsFavorite(!isFavorite)}
            isFavorite={isFavorite}
            size={250}
          />
        </View>

        {/* Generate Button */}
        {!qrData && (
          <TouchableOpacity
            onPress={handleGenerateQR}
            disabled={loading || !content.trim()}
            style={{
              backgroundColor: colors.primary,
              opacity: loading || !content.trim() ? 0.5 : 1,
            }}
            className="py-4 rounded-xl items-center mb-6 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Generar QR</Text>
          </TouchableOpacity>
        )}

        {/* Advanced Customization */}
        {qrData && (
          <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-6">
            {/* Paletas de Colores */}
            <ColorPaletteSelector
              selectedPalette={selectedPalette}
              onSelectPalette={setSelectedPalette}
            />

            {/* Formato de Exportación */}
            <FormatSelector selectedFormat={selectedFormat} onSelectFormat={setSelectedFormat} />

            {/* Estilo del QR */}
            <QRStyleSelector selectedStyle={selectedStyle} onSelectStyle={setSelectedStyle} />

            {/* Update Button */}
            <TouchableOpacity
              onPress={handleGenerateQR}
              style={{ backgroundColor: colors.primary }}
              className="py-3 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-white font-semibold text-sm">Actualizar QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Save to History */}
        {qrData && (
          <TouchableOpacity
            onPress={handleSaveToHistory}
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
