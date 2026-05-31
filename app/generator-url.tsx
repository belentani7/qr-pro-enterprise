import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { QRDisplay } from "@/components/qr-display";
import { ColorPickerSection } from "@/components/color-picker-section";
import { useQRGenerator } from "@/hooks/use-qr-generator";
import { useQRStorage } from "@/hooks/use-qr-storage";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function GeneratorURLScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [url, setUrl] = useState("");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGenerateQR = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Por favor ingresa una URL");
      return;
    }

    let urlToUse = url.trim();
    if (!urlToUse.startsWith("http://") && !urlToUse.startsWith("https://")) {
      urlToUse = "https://" + urlToUse;
    }

    if (!isValidUrl(urlToUse)) {
      Alert.alert("Error", "Por favor ingresa una URL válida");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await generateQR(urlToUse, {
      width: 300,
      color: {
        dark: darkColor,
        light: lightColor,
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
      const fileName = `QR_URL_${Date.now()}.png`;
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
    if (!qrData || !url.trim()) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addToHistory({
      type: "generated",
      qrType: "URL",
      content: url,
      dataUrl: qrData,
      isFavorite,
      customColors: {
        dark: darkColor,
        light: lightColor,
      },
    });

    Alert.alert("Guardado", "QR añadido al historial");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">QR de URL</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-2">Ingresa la URL</Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="rounded-xl flex-row items-center px-4 py-3"
          >
            <IconSymbol name="link" size={18} color={colors.muted} />
            <TextInput
              placeholder="https://ejemplo.com"
              placeholderTextColor={colors.muted}
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                color: colors.foreground,
                flex: 1,
                marginLeft: 8,
                fontFamily: "System",
                fontSize: 16,
              }}
            />
          </View>
          {url && (
            <Text className="text-muted text-xs mt-2">
              {isValidUrl(url.startsWith("http") ? url : "https://" + url) ? "✓ URL válida" : "✗ URL inválida"}
            </Text>
          )}
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
            disabled={loading || !url.trim()}
            style={{
              backgroundColor: colors.primary,
              opacity: loading || !url.trim() ? 0.5 : 1,
            }}
            className="py-4 rounded-xl items-center mb-6 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Generar QR</Text>
          </TouchableOpacity>
        )}

        {/* Color Customization */}
        {qrData && (
          <View className="mb-6 bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-foreground font-semibold text-sm mb-4">Personalizar colores</Text>
            <ColorPickerSection
              darkColor={darkColor}
              lightColor={lightColor}
              onDarkColorChange={setDarkColor}
              onLightColorChange={setLightColor}
            />

            <TouchableOpacity
              onPress={handleGenerateQR}
              style={{ backgroundColor: colors.primary }}
              className="mt-4 py-3 rounded-lg items-center active:opacity-80"
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
