import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, FlatList, Image, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { QRDisplay } from "@/components/qr-display";
import { useQRGenerator } from "@/hooks/use-qr-generator";
import { useQRStorage } from "@/hooks/use-qr-storage";
import { MAX_PROMPT_CHARS, type MultiQRPart, type QRModuleShape } from "@/lib/qr-engine";
import { embedQRInImage, generateShapeFromDescription } from "@/lib/image-steganography-service";
import { pickLocalImageDataUrl, saveQRDataUrl, shareOrExportQRDataUrl } from "@/lib/file-export";

interface ShapeOption {
  id: string;
  name: string;
  moduleShape: QRModuleShape;
  accentColor: string;
  icon: IconSymbolName;
}

const PREDEFINED_SHAPES: ShapeOption[] = [
  { id: "square", name: "Clásico", moduleShape: "square", accentColor: "#0F172A", icon: "square.fill" },
  { id: "rounded", name: "Suave", moduleShape: "rounded", accentColor: "#0284C7", icon: "qrcode" },
  { id: "circle", name: "Orbital", moduleShape: "circle", accentColor: "#0EA5E9", icon: "circle.fill" },
  { id: "diamond", name: "Diamante", moduleShape: "diamond", accentColor: "#7C3AED", icon: "diamond.fill" },
  { id: "heart", name: "Orgánico", moduleShape: "organic", accentColor: "#E11D48", icon: "heart.fill" },
  { id: "star", name: "Estelar", moduleShape: "diamond", accentColor: "#D97706", icon: "star.fill" },
];

export default function GeneratorShapeQRScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [content, setContent] = useState("");
  const [selectedShape, setSelectedShape] = useState<ShapeOption>(PREDEFINED_SHAPES[1]);
  const [customDescription, setCustomDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stegoStatus, setStegoStatus] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [parts, setParts] = useState<MultiQRPart[]>([]);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [opacity, setOpacity] = useState(12);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mode, setMode] = useState<"shape" | "image" | "description">("shape");

  const handlePickImage = async () => {
    try {
      const uri = await pickLocalImageDataUrl();
      if (uri) {
        setSelectedImage(uri);
        setStegoStatus(null);
      }
    } catch {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const handleGenerateQR = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Ingresa el contenido o prompt del QR (hasta 5.000 caracteres)");
      return;
    }

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let moduleShape: QRModuleShape = selectedShape.moduleShape;
    let darkColor = selectedShape.accentColor;

    if (mode === "description" && customDescription.trim()) {
      const derived = await generateShapeFromDescription(customDescription);
      moduleShape = derived.moduleShape;
      darkColor = derived.accentColor;
    }

    if (mode === "image" && selectedImage) {
      const tagged = await embedQRInImage(selectedImage, content, { opacity });
      setStegoStatus(`Payload protegido con CRC32 (${tagged.split("stego=")[1] ?? "OK"})`);
    }

    const result = await generateQR(content, {
      width: 320,
      format: "svg",
      moduleShape,
      color: {
        dark: darkColor,
        light: "#FFFFFF",
      },
    });

    if (result) {
      setQrData(result.dataUrl);
      setParts(result.parts ?? []);
      setActivePartIndex(0);
    }
  };

  const handleDownload = async () => {
    const activeUrl = parts[activePartIndex]?.dataUrl ?? qrData;
    if (!activeUrl) return;
    await saveQRDataUrl(activeUrl, `QR_Forma_${Date.now()}.svg`);
  };

  const handleShare = async () => {
    const activeUrl = parts[activePartIndex]?.dataUrl ?? qrData;
    if (!activeUrl) return;
    await shareOrExportQRDataUrl(activeUrl, `QR_Forma_${Date.now()}.svg`, "Compartir QR con Forma");
  };

  const handleSaveToHistory = async () => {
    const activeUrl = parts[activePartIndex]?.dataUrl ?? qrData;
    if (!activeUrl || !content.trim()) return;
    await addToHistory({
      type: "generated",
      qrType: "Forma / Prompt",
      content,
      dataUrl: activeUrl,
      isFavorite,
      customColors: {
        dark: selectedShape.accentColor,
        light: "#FFFFFF",
      },
    });
    Alert.alert("Guardado", "QR con forma añadido al historial");
  };

  const displayedDataUrl = parts[activePartIndex]?.dataUrl ?? qrData;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">QR con Forma y Prompt</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar generador con forma"
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2 mb-6">
          {(
            [
              { id: "shape", label: "Formas" },
              { id: "description", label: "Prompt 5K" },
              { id: "image", label: "Esteganografía" },
            ] as const
          ).map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMode(m.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m.id }}
              style={{
                backgroundColor: mode === m.id ? colors.primary : colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              className="flex-1 py-2.5 rounded-lg items-center active:opacity-80"
            >
              <Text
                style={{
                  color: mode === m.id ? "white" : colors.foreground,
                }}
                className="font-semibold text-xs"
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-5">
          <Text className="text-foreground font-semibold text-sm mb-2">
            Contenido o Prompt del QR (hasta {MAX_PROMPT_CHARS} caracteres)
          </Text>
          <TextInput
            placeholder="URL, texto o prompt completo de hasta 5.000 caracteres..."
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
              fontSize: 15,
            }}
          />
          <Text className="text-muted text-xs mt-1.5">
            {content.length} / {MAX_PROMPT_CHARS} caracteres
          </Text>
        </View>

        {mode === "shape" && (
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-sm mb-3">Geometría modular</Text>
            <FlatList
              data={PREDEFINED_SHAPES}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 10 }}
              contentContainerStyle={{ gap: 10 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedShape(item)}
                  accessibilityRole="button"
                  style={{
                    backgroundColor: selectedShape.id === item.id ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="flex-1 rounded-xl p-3 items-center gap-1.5 active:opacity-80"
                >
                  <IconSymbol
                    name={item.icon}
                    size={22}
                    color={selectedShape.id === item.id ? "white" : item.accentColor}
                  />
                  <Text
                    style={{
                      color: selectedShape.id === item.id ? "white" : colors.foreground,
                    }}
                    className="font-semibold text-xs text-center"
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {mode === "description" && (
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-sm mb-2">
              Prompt creativo de estilo (hasta {MAX_PROMPT_CHARS} caracteres)
            </Text>
            <TextInput
              placeholder="Ej: prisma diamante #7C3AED minimalista editorial con alto contraste..."
              placeholderTextColor={colors.muted}
              value={customDescription}
              onChangeText={setCustomDescription}
              maxLength={MAX_PROMPT_CHARS}
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
                fontSize: 14,
              }}
            />
            <Text className="text-muted text-xs mt-1.5">
              {customDescription.length} / {MAX_PROMPT_CHARS} caracteres
            </Text>
          </View>
        )}

        {mode === "image" && (
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-sm mb-3">
              Portador de imagen (LSB + CRC32 IEEE 802.3)
            </Text>
            <TouchableOpacity
              onPress={() => void handlePickImage()}
              accessibilityRole="button"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 2,
                borderStyle: "dashed",
              }}
              className="rounded-xl p-6 items-center gap-2 active:opacity-80"
            >
              <IconSymbol name="photo.badge.plus" size={30} color={colors.primary} />
              <Text className="text-foreground font-semibold text-sm">Seleccionar imagen local</Text>
              <Text className="text-muted text-xs text-center">
                Incrusta hasta 5.000 caracteres en los bits menos significativos RGB
              </Text>
            </TouchableOpacity>

            {selectedImage && (
              <View className="mt-4 gap-3">
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: "100%", height: 180, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <View className="flex-row gap-2">
                  {[5, 12, 25].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setOpacity(val)}
                      style={{
                        backgroundColor: opacity === val ? colors.primary : colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                      className="flex-1 py-2 rounded-lg items-center"
                    >
                      <Text
                        style={{ color: opacity === val ? "white" : colors.foreground }}
                        className="text-xs font-semibold"
                      >
                        Opacidad {val}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {stegoStatus && <Text className="text-success text-xs font-semibold">{stegoStatus}</Text>}
              </View>
            )}
          </View>
        )}

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
            {loading ? "Generando..." : "Generar QR"}
          </Text>
        </TouchableOpacity>

        {parts.length > 1 && (
          <View className="mb-4 bg-surface rounded-xl p-3 border border-border gap-2">
            <Text className="text-foreground font-semibold text-xs">
              Secuencia automática ISO/IEC 18004 ({parts.length} partes escaneables)
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

        {displayedDataUrl && (
          <View className="mb-6 items-center gap-4">
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
            <TouchableOpacity
              onPress={() => void handleSaveToHistory()}
              accessibilityRole="button"
              style={{ backgroundColor: colors.success }}
              className="w-full py-3.5 rounded-xl items-center active:opacity-80"
            >
              <Text className="text-white font-semibold text-sm">Guardar en historial</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
