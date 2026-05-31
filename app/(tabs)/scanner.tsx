import { Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

export default function ScannerScreen() {
  const colors = useColors();

  const handleCameraPermission = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implementar lógica de cámara
  };

  return (
    <ScreenContainer className="bg-background items-center justify-center">
      <View className="items-center gap-6 px-4">
        <View className="w-24 h-24 rounded-full bg-primary bg-opacity-10 items-center justify-center">
          <IconSymbol name="qrcode.viewfinder" size={48} color={colors.primary} />
        </View>

        <View className="items-center gap-2">
          <Text className="text-2xl font-bold text-foreground">Escanear QR</Text>
          <Text className="text-base text-muted text-center">
            Apunta tu cámara a un código QR para escanearlo
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCameraPermission}
          style={{ backgroundColor: colors.primary }}
          className="rounded-full px-8 py-4 active:opacity-80"
        >
          <Text className="text-white font-semibold">Abrir Cámara</Text>
        </TouchableOpacity>

        <View className="mt-8 bg-surface rounded-2xl p-4 border border-border w-full">
          <Text className="text-foreground font-semibold mb-3">Consejos</Text>
          <View className="gap-2">
            <View className="flex-row items-start gap-2">
              <Text className="text-primary font-bold">1.</Text>
              <Text className="text-muted text-sm flex-1">Asegúrate de que el código QR sea visible</Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary font-bold">2.</Text>
              <Text className="text-muted text-sm flex-1">Mantén la cámara estable</Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-primary font-bold">3.</Text>
              <Text className="text-muted text-sm flex-1">Acércate lo suficiente para que se detecte</Text>
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
