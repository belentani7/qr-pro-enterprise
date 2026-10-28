import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Image, Share, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { generateQRUrl, COLOR_PRESETS, SIZE_PRESETS, validateQRContent } from "@/lib/qr-server-service";

export default function GeneratorScreen() {
  const colors = useColors();

  const [content, setContent] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("classic");
  const [selectedSize, setSelectedSize] = useState("medium");
  const [remoteConsent, setRemoteConsent] = useState(false);

  const handleGenerateQR = async () => {
    if (!remoteConsent) {
      Alert.alert("Privacidad", "Confirma primero que aceptas enviar este contenido al servicio externo QR Server.");
      return;
    }
    if (!validateQRContent(content)) {
      Alert.alert("Error", "Ingresa un link o texto válido (máx 2953 caracteres)");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const colorPreset = COLOR_PRESETS[selectedColor as keyof typeof COLOR_PRESETS];
      const size = SIZE_PRESETS[selectedSize as keyof typeof SIZE_PRESETS];

      const url = generateQRUrl(content, {
        size,
        darkColor: colorPreset.dark,
        lightColor: colorPreset.light,
        format: "png",
      });

      setQrUrl(url);
    } catch (err) {
      Alert.alert("Error", "No se pudo generar el QR");
    }
  };

  const handleShare = async () => {
    if (!qrUrl) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // QR Server returns an HTTPS image URL, not a local file URI.
      // Sharing.shareAsync cannot reliably share a remote URL as an image.
      await Share.share({ message: "Enlace para ver el código QR: " + qrUrl });
    } catch (err) {
      console.error("Error compartiendo:", err);
    }
  };

  const handleClear = () => {
    setContent("");
    setQrUrl(null);
    setSelectedColor("classic");
    setSelectedSize("medium");
    setRemoteConsent(false);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-foreground mb-2">QR Pro</Text>
          <Text className="text-base text-muted">Generador de códigos QR personalizados</Text>
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

        {/* Color Selector */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Color</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(COLOR_PRESETS).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  setSelectedColor(key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  backgroundColor: value.dark === "000000" ? "#000000" : `#${value.dark}`,
                  borderColor: selectedColor === key ? colors.primary : colors.border,
                  borderWidth: selectedColor === key ? 3 : 1,
                }}
                className="w-12 h-12 rounded-lg items-center justify-center"
              >
                {selectedColor === key && (
                  <IconSymbol name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Size Selector */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Tamaño</Text>
          <View className="flex-row gap-2">
            {Object.entries(SIZE_PRESETS).map(([key]) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  setSelectedSize(key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  backgroundColor:
                    selectedSize === key ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="flex-1 py-2 rounded-lg items-center"
              >
                <Text
                  style={{
                    color: selectedSize === key ? "white" : colors.foreground,
                  }}
                  className="font-semibold text-xs capitalize"
                >
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <Switch
            accessibilityLabel="Autorizo enviar mi texto al servicio externo QR Server"
            value={remoteConsent}
            onValueChange={setRemoteConsent}
          />
          <Text className="flex-1 text-xs leading-relaxed text-muted">
            Este generador utiliza QR Server, un servicio externo. Al generar,
            el texto o enlace se envía a su servidor. No introduzcas contraseñas,
            datos médicos ni información privada. Debes autorizar este envío.
          </Text>
        </View>

        {/* Generate Button */}
        {!qrUrl && (
          <TouchableOpacity
            onPress={handleGenerateQR}
            disabled={!content.trim() || !remoteConsent}
            style={{
              backgroundColor: colors.primary,
              opacity: !content.trim() || !remoteConsent ? 0.5 : 1,
            }}
            className="py-4 rounded-xl items-center mb-6 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Generar QR</Text>
          </TouchableOpacity>
        )}

        {/* QR Preview */}
        {qrUrl && (
          <View className="mb-6 items-center gap-4">
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              className="p-4 rounded-2xl"
            >
              <Image
                source={{ uri: qrUrl }}
                style={{ width: 250, height: 250 }}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={handleShare}
                style={{ backgroundColor: colors.primary }}
                className="flex-1 py-3 rounded-lg items-center active:opacity-80"
              >
                <Text className="text-white font-semibold">Compartir enlace</Text>
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

            {/* Download Link */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert("Imagen QR externa", "Abre el enlace de QR Server en tu navegador para ver o guardar la imagen:\n" + qrUrl);
              }}
              className="py-2"
            >
              <Text className="text-primary font-semibold text-sm">
                Ver imagen QR externa
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View className="bg-surface rounded-2xl p-4 border border-border gap-2 mt-auto">
          <Text className="text-foreground font-semibold text-sm">ℹ️ Cómo usar</Text>
          <Text className="text-muted text-xs leading-relaxed">
            1. Ingresa tu link o texto{"\n"}
            2. Elige color y tamaño{"\n"}
            3. Toca Generar QR{"\n"}
            4. Comparte el enlace o abre la imagen externa
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
