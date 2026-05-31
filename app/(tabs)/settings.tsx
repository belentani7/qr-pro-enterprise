import { Text, View, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<"light" | "dark" | "auto">(colorScheme === "dark" ? "dark" : "light");
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleThemeChange = async (newTheme: "light" | "dark" | "auto") => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(newTheme);
    // TODO: Guardar preferencia en AsyncStorage
  };

  const handleClearHistory = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // TODO: Limpiar historial con confirmación
  };

  const SettingRow = ({
    label,
    description,
    icon,
    onPress,
  }: {
    label: string;
    description?: string;
    icon: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-10 h-10 rounded-lg bg-primary bg-opacity-10 items-center justify-center">
          <IconSymbol name={icon as any} size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-sm">{label}</Text>
          {description && <Text className="text-muted text-xs mt-1">{description}</Text>}
        </View>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="bg-background px-4 py-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text className="text-2xl font-bold text-foreground mb-6">Configuración</Text>

        {/* Appearance Section */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Apariencia</Text>

          <View className="gap-2">
            {["light", "dark", "auto"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => handleThemeChange(t as "light" | "dark" | "auto")}
                style={{
                  backgroundColor: theme === t ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="rounded-xl p-4 flex-row items-center justify-between"
              >
                <Text
                  style={{
                    color: theme === t ? "white" : colors.foreground,
                  }}
                  className="font-semibold text-sm capitalize"
                >
                  {t === "light" ? "Claro" : t === "dark" ? "Oscuro" : "Automático"}
                </Text>
                {theme === t && (
                  <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* General Section */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">General</Text>

          <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-lg bg-primary bg-opacity-10 items-center justify-center">
                <IconSymbol name="camera.fill" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-sm">Vibración</Text>
                <Text className="text-muted text-xs mt-1">Retroalimentación táctil</Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={(value) => {
                setVibrationEnabled(value);
                // TODO: Guardar preferencia
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={vibrationEnabled ? colors.primary : colors.muted}
            />
          </View>

          <SettingRow
            label="Formato de descarga"
            description="PNG, JPG, SVG"
            icon="square.and.arrow.down"
          />

          <SettingRow
            label="Tamaño por defecto"
            description="Dimensiones de QR"
            icon="qrcode"
          />
        </View>

        {/* Data Section */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Datos</Text>

          <SettingRow
            label="Exportar historial"
            description="Descargar como JSON"
            icon="square.and.arrow.down"
          />

          <TouchableOpacity
            onPress={handleClearHistory}
            className="bg-error bg-opacity-10 rounded-xl p-4 border border-error border-opacity-30 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-lg bg-error bg-opacity-20 items-center justify-center">
                <IconSymbol name="trash" size={20} color={colors.error} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.error }} className="font-semibold text-sm">
                  Limpiar historial
                </Text>
                <Text className="text-muted text-xs mt-1">Eliminar todos los datos</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View className="mb-8">
          <Text className="text-foreground font-semibold text-sm mb-3">Acerca de</Text>

          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-sm">Versión</Text>
              <Text className="text-foreground font-semibold text-sm">1.0.0</Text>
            </View>
            <View className="h-px bg-border" />
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-sm">Desarrollador</Text>
              <Text className="text-foreground font-semibold text-sm">QR Pro Team</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
