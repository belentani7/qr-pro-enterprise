import { Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useQRStorage } from "@/hooks/use-qr-storage";
import { decodeQRFromRGBA, reassembleMultiQRPayloads } from "@/lib/qr-engine";
import { copyTextToClipboard, pickLocalImageDataUrl } from "@/lib/file-export";

async function decodeImageUriOnWeb(uri: string): Promise<string | null> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return null;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = 1024;
      const ratio = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const decoded = decodeQRFromRGBA(imageData.data, width, height);
      resolve(decoded ? decoded.content : null);
    };
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

function classifyQRPayload(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return "URL";
  if (/^WIFI:/i.test(raw)) return "Wi-Fi";
  if (/^BEGIN:VCARD/i.test(raw)) return "Contacto";
  if (/^mailto:/i.test(raw)) return "Email";
  if (/^tel:/i.test(raw)) return "Teléfono";
  if (/^smsto:/i.test(raw)) return "SMS";
  if (/^\[QRP \d+\/\d+\]/.test(raw)) return "Secuencia QR";
  return "Texto";
}

export default function ScannerScreen() {
  const colors = useColors();
  const { addToHistory } = useQRStorage();
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [collectedParts, setCollectedParts] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [scanning, setScanning] = useState(false);

  const registerDecodedPayload = async (payload: string) => {
    const qrType = classifyQRPayload(payload);
    if (/^\[QRP \d+\/\d+\]/.test(payload)) {
      const nextParts = Array.from(new Set([...collectedParts, payload]));
      setCollectedParts(nextParts);
      const merged = reassembleMultiQRPayloads(nextParts);
      setScannedResult(merged);
      await addToHistory({
        type: "scanned",
        qrType,
        content: merged,
        isFavorite: false,
      });
      return;
    }
    setCollectedParts([]);
    setScannedResult(payload);
    await addToHistory({
      type: "scanned",
      qrType,
      content: payload,
      isFavorite: false,
    });
  };

  const handleScanFromImage = async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setScanning(true);
      const assetUri = await pickLocalImageDataUrl();
      if (!assetUri) {
        setScanning(false);
        if (Platform.OS !== "web") {
          Alert.alert(
            "Modo verificador local",
            "Pega o introduce el contenido escaneado en el verificador inferior para clasificarlo y guardarlo."
          );
        }
        return;
      }

      if (Platform.OS === "web") {
        const decoded = await decodeImageUriOnWeb(assetUri);
        setScanning(false);
        if (decoded) {
          await registerDecodedPayload(decoded);
        } else {
          Alert.alert(
            "No se detectó un QR",
            "Asegúrate de que la imagen tenga buen contraste y márgenes visibles."
          );
        }
        return;
      }

      setScanning(false);
      Alert.alert(
        "Imagen seleccionada",
        "Para decodificación directa sin navegador, pega o valida el payload en el verificador inferior."
      );
    } catch {
      setScanning(false);
      Alert.alert("Error", "No se pudo analizar la imagen seleccionada");
    }
  };

  const handleVerifyManualPayload = async () => {
    const clean = manualInput.trim();
    if (!clean) {
      Alert.alert("Aviso", "Introduce o pega un contenido QR para verificarlo y guardarlo");
      return;
    }
    await registerDecodedPayload(clean);
    setManualInput("");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        <View className="items-center gap-5">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mt-2">
            <IconSymbol name="qrcode.viewfinder" size={44} color={colors.primary} />
          </View>

          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-foreground">Escáner y Decodificador QR</Text>
            <Text className="text-sm text-muted text-center">
              Decodifica imágenes QR localmente con jsQR (sin enviar capturas a servidores) y reensambla secuencias de hasta 5.000 caracteres.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => void handleScanFromImage()}
            disabled={scanning}
            accessibilityRole="button"
            style={{ backgroundColor: colors.primary, opacity: scanning ? 0.6 : 1 }}
            className="rounded-full px-8 py-4 flex-row items-center gap-2 active:opacity-80"
          >
            <IconSymbol name="photo.badge.plus" size={20} color="white" />
            <Text className="text-white font-semibold">
              {scanning ? "Analizando imagen..." : "Escanear desde Imagen"}
            </Text>
          </TouchableOpacity>

          {scannedResult && (
            <View className="w-full bg-surface rounded-2xl p-4 border border-border gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground font-bold text-sm">
                  Resultado ({classifyQRPayload(scannedResult)})
                </Text>
                {collectedParts.length > 0 && (
                  <Text className="text-primary text-xs font-semibold">
                    {collectedParts.length} partes unidas
                  </Text>
                )}
              </View>
              <Text className="text-foreground text-sm" selectable>
                {scannedResult}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await copyTextToClipboard(scannedResult);
                  Alert.alert("Copiado", "Resultado copiado al portapapeles");
                }}
                accessibilityRole="button"
                style={{ backgroundColor: colors.primary }}
                className="py-2.5 rounded-lg items-center flex-row justify-center gap-2"
              >
                <IconSymbol name="doc.on.doc" size={16} color="white" />
                <Text className="text-white font-semibold text-xs">Copiar Resultado</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="w-full bg-surface rounded-2xl p-4 border border-border gap-3 mt-2">
            <Text className="text-foreground font-semibold text-sm">
              Reensamblador / Verificador de Payload (hasta 5.000 caracteres)
            </Text>
            <TextInput
              placeholder="Pega contenido escaneado o partes [QRP 1/3]..."
              placeholderTextColor={colors.muted}
              value={manualInput}
              onChangeText={setManualInput}
              maxLength={5000}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: 1,
                color: colors.foreground,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                fontSize: 14,
              }}
            />
            <TouchableOpacity
              onPress={() => void handleVerifyManualPayload()}
              accessibilityRole="button"
              className="py-2.5 rounded-lg items-center bg-primary/15"
            >
              <Text style={{ color: colors.primary }} className="font-semibold text-xs">
                Clasificar y Guardar en Historial
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
