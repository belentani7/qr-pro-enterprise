import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

const QR_TYPES = [
  { id: "text", label: "Texto", icon: "mail", description: "Texto simple" },
  { id: "text-advanced", label: "Avanzado", icon: "sparkles", description: "Con estilos" },
  { id: "url", label: "URL", icon: "link", description: "Enlace web" },
  { id: "wifi", label: "Wi-Fi", icon: "qrcode", description: "Red Wi-Fi" },
  { id: "contact", label: "Contacto", icon: "person", description: "vCard" },
  { id: "email", label: "Email", icon: "mail", description: "Correo" },
  { id: "sms", label: "SMS", icon: "paperplane.fill", description: "Mensaje" },
  { id: "phone", label: "Teléfono", icon: "phone", description: "Llamada" },
  { id: "shape", label: "Forma", icon: "square.grid.2x2", description: "Con forma" },
];

export default function GeneratorScreen() {
  const router = useRouter();
  const colors = useColors();

  const handleTypeSelect = async (typeId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const routeMap: { [key: string]: any } = {
      text: "/generator-text",
      "text-advanced": "/generator-text-advanced",
      url: "/generator-url",
      wifi: "/generator-wifi",
      contact: "/generator-contact",
      email: "/generator-email",
      sms: "/generator-sms",
      phone: "/generator-phone",
      shape: "/generator-shape-qr",
    };
    if (routeMap[typeId]) {
      router.push(routeMap[typeId] as any);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 py-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-4xl font-bold text-foreground mb-2">QR Pro</Text>
            <Text className="text-base text-muted">Genera códigos QR fácilmente</Text>
          </View>

          {/* Quick Actions */}
          <View className="gap-3 mb-8">
            <Pressable
              onPress={() => handleTypeSelect("text")}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              className="rounded-2xl p-4 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-white font-semibold text-lg">Generar QR</Text>
                <Text className="text-white opacity-80 text-sm">Crea tu código QR</Text>
              </View>
              <IconSymbol name="chevron.right" size={24} color="white" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // TODO: Navegar a escáner
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
              className="rounded-2xl p-4 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-foreground font-semibold text-lg">Escanear QR</Text>
                <Text className="text-muted text-sm">Lee códigos QR</Text>
              </View>
              <IconSymbol name="chevron.right" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Types Grid */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Tipos de QR</Text>
            <View className="flex-row flex-wrap gap-3">
              {QR_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  onPress={() => handleTypeSelect(type.id)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      minWidth: "45%",
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.7 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  className="rounded-xl p-4 items-center"
                >
                  <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mb-2">
                    <IconSymbol name="qrcode" size={20} color="white" />
                  </View>
                  <Text className="text-foreground font-semibold text-sm text-center">{type.label}</Text>
                  <Text className="text-muted text-xs text-center mt-1">{type.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Info Section */}
          <View className="mt-8 bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-foreground font-semibold mb-2">Características</Text>
            <View className="gap-2">
              <View className="flex-row items-start gap-2">
                <Text className="text-primary font-bold">•</Text>
                <Text className="text-muted text-sm flex-1">Genera QR para múltiples tipos de contenido</Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-primary font-bold">•</Text>
                <Text className="text-muted text-sm flex-1">Personaliza colores y tamaños</Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-primary font-bold">•</Text>
                <Text className="text-muted text-sm flex-1">Guarda en historial y favoritos</Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-primary font-bold">•</Text>
                <Text className="text-muted text-sm flex-1">Descarga o comparte fácilmente</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
