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

const generateSMSString = (phone: string, message: string): string => {
  let sms = `smsto:${phone}`;
  if (message) sms += `?body=${encodeURIComponent(message)}`;
  return sms;
};

export default function GeneratorSMSScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGenerateQR = async () => {
    if (!phone.trim()) {
      Alert.alert("Error", "Por favor ingresa un número de teléfono");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const smsString = generateSMSString(phone, message);
    const result = await generateQR(smsString, {
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
      const fileName = `QR_SMS_${Date.now()}.png`;
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
    if (!qrData || !phone.trim()) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addToHistory({
      type: "generated",
      qrType: "SMS",
      content: phone,
      dataUrl: qrData,
      isFavorite,
      customColors: {
        dark: darkColor,
        light: lightColor,
      },
    });

    Alert.alert("Guardado", "QR de SMS añadido al historial");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">QR de SMS</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Phone Input */}
        <View className="mb-4">
          <Text className="text-foreground font-semibold text-sm mb-2">Número de teléfono *</Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="rounded-xl flex-row items-center px-4 py-3"
          >
            <IconSymbol name="phone" size={18} color={colors.muted} />
            <TextInput
              placeholder="+34 123 456 789"
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={{
                color: colors.foreground,
                flex: 1,
                marginLeft: 8,
                fontFamily: "System",
                fontSize: 16,
              }}
            />
          </View>
        </View>

        {/* Message Input */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-2">Mensaje (opcional)</Text>
          <TextInput
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
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
          <Text className="text-muted text-xs mt-2">{message.length} caracteres</Text>
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
            disabled={loading || !phone.trim()}
            style={{
              backgroundColor: colors.primary,
              opacity: loading || !phone.trim() ? 0.5 : 1,
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
