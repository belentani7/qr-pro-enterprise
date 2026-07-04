import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { QRDisplay } from "@/components/qr-display";
import { useQRGenerator } from "@/hooks/use-qr-generator";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";

export default function GeneratorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();

  const [content, setContent] = useState("");
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGenerateQR = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Ingresa un link o texto");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await generateQR(content, {
        width: 300,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      if (result) {
        setQrData(result.dataUrl);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo generar el QR");
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

  const handleClear = () => {
    setContent("");
    setQrData(undefined);
    setIsFavorite(false);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-foreground mb-2">QR Pro</Text>
          <Text className="text-base text-muted">Generador de códigos QR</Text>
        </View>

        {/* Input Section */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-2">Link o Texto</Text>
          <TextInput
            placeholder="Ingresa tu link o texto"
            placeholderTextColor={colors.muted}
            value={content}
            onChangeText={setContent}
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
            <Text className="text-white font-semibold text-base">
              {loading ? "Generando..." : "Generar QR"}
            </Text>
          </TouchableOpacity>
        )}

        {/* QR Preview */}
        {qrData && (
          <View className="mb-6 items-center gap-4">
            <QRDisplay
              dataUrl={qrData}
              loading={loading}
              error={error}
              onDownload={() => Alert.alert("Descargado", "QR guardado")}
              onShare={handleShare}
              onFavorite={() => setIsFavorite(!isFavorite)}
              isFavorite={isFavorite}
              size={250}
            />

            {/* Action Buttons */}
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={handleShare}
                style={{ backgroundColor: colors.primary }}
                className="flex-1 py-3 rounded-lg items-center active:opacity-80"
              >
                <Text className="text-white font-semibold">Compartir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClear}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="flex-1 py-3 rounded-lg items-center active:opacity-80"
              >
                <Text className="text-foreground font-semibold">Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info */}
        <View className="bg-surface rounded-2xl p-4 border border-border gap-2 mt-auto">
          <Text className="text-foreground font-semibold text-sm">ℹ️ Cómo usar</Text>
          <Text className="text-muted text-xs leading-relaxed">
            1. Ingresa tu link o texto{"\n"}
            2. Toca "Generar QR"{"\n"}
            3. Comparte o descarga el código
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
