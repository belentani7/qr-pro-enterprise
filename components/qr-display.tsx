import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

interface QRDisplayProps {
  dataUrl?: string;
  loading?: boolean;
  error?: string | null;
  onDownload?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  size?: number;
}

export function QRDisplay({
  dataUrl,
  loading = false,
  error = null,
  onDownload,
  onShare,
  onFavorite,
  isFavorite = false,
  size = 250,
}: QRDisplayProps) {
  const colors = useColors();

  if (error) {
    return (
      <View className="items-center gap-3">
        <View
          style={{ backgroundColor: colors.error + "20" }}
          className="rounded-2xl p-6 items-center gap-2"
        >
          <IconSymbol name="xmark" size={32} color={colors.error} />
          <Text style={{ color: colors.error }} className="font-semibold text-center">
            Error
          </Text>
          <Text className="text-muted text-sm text-center">{error}</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="items-center justify-center" style={{ height: size }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!dataUrl) {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 2,
          borderStyle: "dashed",
        }}
        className="rounded-2xl items-center justify-center"
      >
        <Text className="text-muted text-sm">Genera un QR para verlo aquí</Text>
      </View>
    );
  }

  return (
    <View className="items-center gap-4">
      {/* QR Image */}
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: "white",
          borderRadius: 12,
          padding: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Image
          source={{ uri: dataUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        {onDownload && (
          <TouchableOpacity
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDownload();
            }}
            style={{ backgroundColor: colors.primary }}
            className="flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
          >
            <IconSymbol name="square.and.arrow.down" size={18} color="white" />
            <Text className="text-white font-semibold text-sm">Descargar</Text>
          </TouchableOpacity>
        )}

        {onShare && (
          <TouchableOpacity
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onShare();
            }}
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            className="flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="font-semibold text-sm">
              Compartir
            </Text>
          </TouchableOpacity>
        )}

        {onFavorite && (
          <TouchableOpacity
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFavorite();
            }}
            style={{
              backgroundColor: isFavorite ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="px-4 py-3 rounded-lg items-center justify-center active:opacity-80"
          >
            <IconSymbol
              name={isFavorite ? "heart.fill" : "heart"}
              size={18}
              color={isFavorite ? "white" : colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
