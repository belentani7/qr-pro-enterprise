import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Image, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { useQRGenerator } from "@/hooks/use-qr-generator";
import { useQRStorage } from "@/hooks/use-qr-storage";
import { COLOR_PRESETS, SIZE_PRESETS } from "@/lib/qr-server-service";
import { MAX_PROMPT_CHARS, type MultiQRPart } from "@/lib/qr-engine";
import { saveQRDataUrl, shareOrExportQRDataUrl } from "@/lib/file-export";

const QUICK_ROUTES: {
  route:
    | "/generator-shape-qr"
    | "/generator-text-advanced"
    | "/generator-wifi"
    | "/generator-contact"
    | "/generator-url"
    | "/generator-email"
    | "/generator-sms"
    | "/generator-phone";
  label: string;
  icon: IconSymbolName;
}[] = [
  { route: "/generator-shape-qr", label: "Prompt 5K / Forma", icon: "sparkles" },
  { route: "/generator-text-advanced", label: "Estudio Avanzado", icon: "qrcode" },
  { route: "/generator-wifi", label: "Red Wi-Fi", icon: "wifi" },
  { route: "/generator-contact", label: "Contacto vCard", icon: "person" },
  { route: "/generator-url", label: "Enlace Web", icon: "link" },
  { route: "/generator-email", label: "Correo Email", icon: "mail" },
  { route: "/generator-sms", label: "Mensaje SMS", icon: "paperplane.fill" },
  { route: "/generator-phone", label: "Teléfono", icon: "phone" },
];

export default function GeneratorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [content, setContent] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [parts, setParts] = useState<MultiQRPart[]>([]);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("classic");
  const [selectedSize, setSelectedSize] = useState("medium");

  const handleGenerateQR = async () => {
    if (!content.trim() || content.length > MAX_PROMPT_CHARS) {
      Alert.alert("Error", `Ingresa un enlace, texto o prompt válido (máx. ${MAX_PROMPT_CHARS} caracteres)`);
      return;
    }

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const colorPreset = COLOR_PRESETS[selectedColor as keyof typeof COLOR_PRESETS];
    const size = SIZE_PRESETS[selectedSize as keyof typeof SIZE_PRESETS];

    const result = await generateQR(content, {
      width: size,
      format: "svg",
      moduleShape: "rounded",
      color: {
        dark: `#${colorPreset.dark.replace(/^#/, "")}`,
        light: `#${colorPreset.light.replace(/^#/, "")}`,
      },
    });

    if (result) {
      setQrUrl(result.dataUrl);
      setParts(result.parts ?? []);
      setActivePartIndex(0);
      await addToHistory({
        type: "generated",
        qrType: result.isMultiPart ? "Secuencia 5K" : "Rápido",
        content,
        dataUrl: result.dataUrl,
        isFavorite: false,
      });
    } else {
      Alert.alert("Error", "No se pudo generar el código QR");
    }
  };

  const displayedUrl = parts[activePartIndex]?.dataUrl ?? qrUrl;

  const handleShare = async () => {
    if (!displayedUrl) return;
    await shareOrExportQRDataUrl(displayedUrl, `QR_Pro_${Date.now()}.svg`, "Compartir QR");
  };

  const handleDownload = async () => {
    if (!displayedUrl) return;
    const { fileName } = await saveQRDataUrl(displayedUrl, `QR_Pro_${Date.now()}.svg`);
    Alert.alert("Exportado", `Código QR guardado como ${fileName}`);
  };

  const handleClear = () => {
    setContent("");
    setQrUrl(null);
    setParts([]);
    setActivePartIndex(0);
    setSelectedColor("classic");
    setSelectedSize("medium");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-1">QR Pro Enterprise</Text>
          <Text className="text-sm text-muted">
            Generación vectorial 100 % local · Prompts hasta {MAX_PROMPT_CHARS} caracteres
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Generadores Especializados</Text>
          <View className="flex-row flex-wrap gap-2">
            {QUICK_ROUTES.map((item) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route)}
                accessibilityRole="button"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="px-3 py-2.5 rounded-xl flex-row items-center gap-2 active:opacity-80"
              >
                <IconSymbol name={item.icon} size={18} color={colors.primary} />
                <Text className="text-foreground font-semibold text-xs">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-foreground font-semibold text-sm mb-2">
            Enlace, Texto o Prompt Rápido
          </Text>
          <TextInput
            placeholder="Ingresa URL, texto o prompt completo..."
            placeholderTextColor={colors.muted}
            value={content}
            onChangeText={setContent}
            maxLength={MAX_PROMPT_CHARS}
            multiline
            numberOfLines={3}
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
          <Text className="text-muted text-xs mt-1.5">
            {content.length} / {MAX_PROMPT_CHARS} caracteres
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-foreground font-semibold text-sm mb-3">Paleta Cromática</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(COLOR_PRESETS).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedColor(key)}
                accessibilityRole="button"
                accessibilityLabel={`Color ${key}`}
                style={{
                  backgroundColor: `#${value.dark.replace(/^#/, "")}`,
                  borderColor: selectedColor === key ? colors.primary : colors.border,
                  borderWidth: selectedColor === key ? 3 : 1,
                }}
                className="w-11 h-11 rounded-lg items-center justify-center"
              >
                {selectedColor === key && (
                  <IconSymbol name="checkmark" size={18} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Resolución</Text>
          <View className="flex-row gap-2">
            {Object.entries(SIZE_PRESETS).map(([key]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedSize(key)}
                accessibilityRole="button"
                style={{
                  backgroundColor: selectedSize === key ? colors.primary : colors.surface,
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
          <Text className="text-white font-semibold text-base">
            {loading ? "Generando..." : "Generar QR Local"}
          </Text>
        </TouchableOpacity>

        {parts.length > 1 && (
          <View className="mb-4 bg-surface rounded-xl p-3 border border-border gap-2">
            <Text className="text-foreground font-semibold text-xs">
              Secuencia automática ({parts.length} partes escaneables)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {parts.map((p, idx) => (
                <TouchableOpacity
                  key={p.index}
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
                    Parte {p.index}/{p.total}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {displayedUrl && (
          <View className="mb-6 items-center gap-4">
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: colors.border,
                borderWidth: 1,
              }}
              className="p-4 rounded-2xl"
            >
              <Image source={{ uri: displayedUrl }} style={{ width: 250, height: 250 }} />
            </View>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => void handleDownload()}
                accessibilityRole="button"
                style={{ backgroundColor: colors.primary }}
                className="flex-1 py-3 rounded-lg items-center active:opacity-80"
              >
                <Text className="text-white font-semibold">Descargar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleShare()}
                accessibilityRole="button"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="flex-1 py-3 rounded-lg items-center active:opacity-80"
              >
                <Text className="text-foreground font-semibold">Compartir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClear}
                accessibilityRole="button"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="px-4 py-3 rounded-lg items-center active:opacity-80"
              >
                <Text className="text-foreground font-semibold">Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="bg-surface rounded-2xl p-4 border border-border gap-2 mt-auto">
          <Text className="text-foreground font-semibold text-sm">Cómo usar</Text>
          <Text className="text-muted text-xs leading-relaxed">
            1. Ingresa tu enlace, credencial o prompt (hasta 5.000 caracteres).{"\n"}
            2. Selecciona la paleta cromática y resolución deseada.{"\n"}
            3. Pulsa &laquo;Generar QR Local&raquo; para renderizar sin enviar datos externos.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
