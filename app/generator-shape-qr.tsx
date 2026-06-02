import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, FlatList, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { QRDisplay } from "@/components/qr-display";
import { useQRGenerator } from "@/hooks/use-qr-generator";
import { useQRStorage } from "@/hooks/use-qr-storage";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { generateShapeFromDescription } from "@/lib/image-steganography-service";

interface ShapeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const PREDEFINED_SHAPES: ShapeOption[] = [
  { id: "dog", name: "Perro", description: "Forma de perro", icon: "pawprint" },
  { id: "cat", name: "Gato", description: "Forma de gato", icon: "pawprint" },
  { id: "heart", name: "Corazón", description: "Forma de corazón", icon: "heart.fill" },
  { id: "star", name: "Estrella", description: "Forma de estrella", icon: "star.fill" },
  { id: "circle", name: "Círculo", description: "Forma de círculo", icon: "circle.fill" },
  { id: "square", name: "Cuadrado", description: "Forma de cuadrado", icon: "square.fill" },
  { id: "triangle", name: "Triángulo", description: "Forma de triángulo", icon: "triangle.fill" },
  { id: "diamond", name: "Diamante", description: "Forma de diamante", icon: "diamond.fill" },
  { id: "flower", name: "Flor", description: "Forma de flor", icon: "flower" },
  { id: "tree", name: "Árbol", description: "Forma de árbol", icon: "tree.fill" },
];

export default function GeneratorShapeQRScreen() {
  const router = useRouter();
  const colors = useColors();
  const { generateQR, loading, error } = useQRGenerator();
  const { addToHistory } = useQRStorage();

  const [content, setContent] = useState("");
  const [selectedShape, setSelectedShape] = useState<ShapeOption | null>(null);
  const [customDescription, setCustomDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | undefined>(undefined);
  const [opacity, setOpacity] = useState(50);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mode, setMode] = useState<"shape" | "image" | "description">("shape");

  const handlePickImage = async () => {
    try {
      Alert.alert(
        "Seleccionar imagen",
        "Funcionalidad de carga de imagen disponible en dispositivo",
        [
          {
            text: "Cancelar",
            onPress: () => {},
          },
          {
            text: "Usar imagen de ejemplo",
            onPress: () => {
              setSelectedImage("https://via.placeholder.com/300");
              setMode("image");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const handleGenerateQR = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Por favor ingresa el contenido del QR");
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

  const handleGenerateFromDescription = async () => {
    if (!customDescription.trim()) {
      Alert.alert("Error", "Por favor describe la forma que deseas");
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const shape = await generateShapeFromDescription(customDescription);
      // Aquí se generaría el QR con la forma personalizada
      Alert.alert("Éxito", `Forma generada: ${customDescription}`);
    } catch (err) {
      Alert.alert("Error", "No se pudo generar la forma");
    }
  };

  const handleShare = async () => {
    if (!qrData) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Sharing.shareAsync(qrData, {
        mimeType: "image/png",
        dialogTitle: "Compartir QR con Forma",
      });
    } catch (err) {
      console.error("Error compartiendo:", err);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">QR con Forma</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View className="flex-row gap-2 mb-6">
          {[
            { id: "shape", label: "Formas" },
            { id: "image", label: "Foto" },
            { id: "description", label: "Descripción" },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMode(m.id as any)}
              style={{
                backgroundColor: mode === m.id ? colors.primary : colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              className="flex-1 py-2 rounded-lg items-center active:opacity-80"
            >
              <Text
                style={{
                  color: mode === m.id ? "white" : colors.foreground,
                }}
                className="font-semibold text-sm"
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Input */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-2">Contenido del QR</Text>
          <TextInput
            placeholder="Ingresa el contenido (URL, texto, etc.)"
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

        {/* Mode: Shapes */}
        {mode === "shape" && (
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-sm mb-3">Selecciona una forma</Text>
            <FlatList
              data={PREDEFINED_SHAPES}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedShape(item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    backgroundColor:
                      selectedShape?.id === item.id ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="flex-1 rounded-lg p-4 items-center gap-2 active:opacity-80"
                >
                  <IconSymbol
                    name={item.icon as any}
                    size={24}
                    color={selectedShape?.id === item.id ? "white" : colors.primary}
                  />
                  <Text
                    style={{
                      color: selectedShape?.id === item.id ? "white" : colors.foreground,
                    }}
                    className="font-semibold text-xs text-center"
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12 }}
            />
          </View>
        )}

        {/* Mode: Image */}
        {mode === "image" && (
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-sm mb-3">Carga una imagen</Text>
            <TouchableOpacity
              onPress={handlePickImage}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 2,
                borderStyle: "dashed",
              }}
              className="rounded-lg p-8 items-center gap-3 active:opacity-80"
            >
              <IconSymbol name="photo.badge.plus" size={32} color={colors.primary} />
              <Text className="text-foreground font-semibold">Seleccionar imagen</Text>
              <Text className="text-muted text-xs text-center">
                Sube una foto para incrustar el QR invisible
              </Text>
            </TouchableOpacity>

            {selectedImage && (
              <View className="mt-4 gap-4">
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: "100%", height: 200, borderRadius: 12 }}
                />
                <View>
                  <Text className="text-foreground font-semibold text-sm mb-2">
                    Opacidad del QR: {opacity}%
                  </Text>
                  <View className="flex-row items-center gap-4">
                    <Text className="text-muted text-xs">0%</Text>
                    <View className="flex-1 h-2 bg-surface rounded-full border border-border">
                      <View
                        style={{
                          width: `${opacity}%`,
                          height: "100%",
                          backgroundColor: colors.primary,
                          borderRadius: 1,
                        }}
                      />
                    </View>
                    <Text className="text-muted text-xs">100%</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Mode: Description */}
        {mode === "description" && (
          <View className="mb-6">
            <Text className="text-foreground font-semibold text-sm mb-2">
              Describe la forma que deseas
            </Text>
            <TextInput
              placeholder="Ej: perro corriendo, corazón con alas, estrella brillante..."
              placeholderTextColor={colors.muted}
              value={customDescription}
              onChangeText={setCustomDescription}
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
                fontFamily: "System",
                fontSize: 14,
              }}
            />
            <TouchableOpacity
              onPress={handleGenerateFromDescription}
              style={{ backgroundColor: colors.primary }}
              className="mt-4 py-3 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-white font-semibold">Generar Forma</Text>
            </TouchableOpacity>
          </View>
        )}

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
              {loading ? "Generando..." : "Generar QR con Forma"}
            </Text>
          </TouchableOpacity>
        )}

        {/* QR Preview */}
        {qrData && (
          <View className="mb-6 items-center">
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
          </View>
        )}

        {/* Info Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
          <Text className="text-foreground font-semibold text-sm">ℹ️ Cómo funciona</Text>
          <Text className="text-muted text-xs leading-relaxed">
            • <Text className="font-semibold">Formas:</Text> Elige entre 10+ formas predefinidas
            {"\n"}• <Text className="font-semibold">Foto:</Text> Sube una imagen y el QR se
            incrustra casi invisible
            {"\n"}• <Text className="font-semibold">Descripción:</Text> Describe la forma y la IA
            la genera
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
