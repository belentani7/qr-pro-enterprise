import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Pressable } from "react-native";
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

type SecurityType = "WPA" | "WEP" | "nopass";

const generateWiFiString = (ssid: string, password: string, security: SecurityType): string => {
  // Formato: WIFI:T:WPA;S:SSID;P:PASSWORD;;
  if (security === "nopass") {
    return `WIFI:T:nopass;S:${ssid};;`;
  }
  return `WIFI:T:${security};S:${ssid};P:${password};;`;
};

export default function GeneratorWiFiScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [ssid, setSSID] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<SecurityType>("WPA");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGenerateQR = async () => {
    if (!ssid.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre de la red (SSID)");
      return;
    }

    if (security !== "nopass" && !password.trim()) {
      Alert.alert("Error", "Por favor ingresa la contraseña");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const wifiString = generateWiFiString(ssid, password, security);
    const result = await generateQR(wifiString, {
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
      const fileName = `QR_WiFi_${Date.now()}.png`;
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
    if (!qrData || !ssid.trim()) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addToHistory({
      type: "generated",
      qrType: "Wi-Fi",
      content: `${ssid} (${security})`,
      dataUrl: qrData,
      isFavorite,
      customColors: {
        dark: darkColor,
        light: lightColor,
      },
    });

    Alert.alert("Guardado", "QR de Wi-Fi añadido al historial");
  };

  const SecurityButton = ({ type, label }: { type: SecurityType; label: string }) => (
    <Pressable
      onPress={() => setSecurity(type)}
      style={{
        backgroundColor: security === type ? colors.primary : colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      }}
      className="flex-1 py-2 rounded-lg items-center"
    >
      <Text
        style={{
          color: security === type ? "white" : colors.foreground,
        }}
        className="font-semibold text-sm"
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">QR de Wi-Fi</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* SSID Input */}
        <View className="mb-4">
          <Text className="text-foreground font-semibold text-sm mb-2">Nombre de la red (SSID)</Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="rounded-xl flex-row items-center px-4 py-3"
          >
            <IconSymbol name="qrcode" size={18} color={colors.muted} />
            <TextInput
              placeholder="Mi Red Wi-Fi"
              placeholderTextColor={colors.muted}
              value={ssid}
              onChangeText={setSSID}
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

        {/* Security Type */}
        <View className="mb-4">
          <Text className="text-foreground font-semibold text-sm mb-2">Tipo de seguridad</Text>
          <View className="flex-row gap-2">
            <SecurityButton type="WPA" label="WPA" />
            <SecurityButton type="WEP" label="WEP" />
            <SecurityButton type="nopass" label="Sin contraseña" />
          </View>
        </View>

        {/* Password Input */}
        {security !== "nopass" && (
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-sm mb-2">Contraseña</Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              className="rounded-xl flex-row items-center px-4 py-3"
            >
              <IconSymbol name="lock" size={18} color={colors.muted} />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
        )}

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
            disabled={loading || !ssid.trim() || (security !== "nopass" && !password.trim())}
            style={{
              backgroundColor: colors.primary,
              opacity:
                loading || !ssid.trim() || (security !== "nopass" && !password.trim()) ? 0.5 : 1,
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
