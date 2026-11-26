import { Text, View, ScrollView, TouchableOpacity, Switch, Alert, Platform } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { useQRStorage } from "@/hooks/use-qr-storage";
import { exportPortableUserData } from "@/lib/security-service";
import { copyTextToClipboard } from "@/lib/file-export";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";

const PREFS_STORAGE_KEY = "@qr_pro_preferences";

interface AppPreferences {
  theme: "light" | "dark";
  vibrationEnabled: boolean;
  defaultFormat: "PNG" | "SVG";
  defaultSize: 256 | 320 | 512;
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { clearHistory } = useQRStorage();

  const [prefs, setPrefs] = useState<AppPreferences>({
    theme: colorScheme,
    vibrationEnabled: true,
    defaultFormat: "SVG",
    defaultSize: 320,
  });

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<AppPreferences>;
          const resolvedTheme = parsed.theme === "dark" ? "dark" : "light";
          setPrefs((prev) => ({
            ...prev,
            ...parsed,
            theme: resolvedTheme,
          }));
          setColorScheme(resolvedTheme);
        }
      } catch {
        // Preferencias por defecto si AsyncStorage aún no contiene datos
      }
    })();
  }, [setColorScheme]);

  const persistPrefs = async (next: AppPreferences) => {
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
  };

  const handleThemeChange = async (newTheme: "light" | "dark") => {
    if (Platform.OS !== "web" && prefs.vibrationEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setColorScheme(newTheme);
    await persistPrefs({ ...prefs, theme: newTheme });
  };

  const handleToggleFormat = async () => {
    const nextFormat = prefs.defaultFormat === "SVG" ? "PNG" : "SVG";
    await persistPrefs({ ...prefs, defaultFormat: nextFormat });
  };

  const handleCycleSize = async () => {
    const nextSize = prefs.defaultSize === 256 ? 320 : prefs.defaultSize === 320 ? 512 : 256;
    await persistPrefs({ ...prefs, defaultSize: nextSize });
  };

  const handleExportHistory = async () => {
    try {
      const json = await exportPortableUserData();
      await copyTextToClipboard(json);
      Alert.alert("Exportación completada", "Historial y favoritos copiados en JSON al portapapeles.");
    } catch {
      Alert.alert("Error", "No se pudo exportar el historial");
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Limpiar historial",
      "¿Deseas eliminar todos los códigos QR guardados en el historial y favoritos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web" && prefs.vibrationEnabled) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await clearHistory();
            Alert.alert("Historial limpio", "Se han eliminado los registros locales.");
          },
        },
      ]
    );
  };

  const SettingRow = ({
    label,
    description,
    icon,
    onPress,
  }: {
    label: string;
    description?: string;
    icon: IconSymbolName;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      activeOpacity={0.7}
      className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
          <IconSymbol name={icon} size={20} color={colors.primary} />
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
        <Text className="text-2xl font-bold text-foreground mb-6">Configuración</Text>

        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Apariencia</Text>
          <View className="gap-2">
            {(["light", "dark"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => void handleThemeChange(t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: prefs.theme === t }}
                style={{
                  backgroundColor: prefs.theme === t ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="rounded-xl p-4 flex-row items-center justify-between"
              >
                <Text
                  style={{
                    color: prefs.theme === t ? "white" : colors.foreground,
                  }}
                  className="font-semibold text-sm"
                >
                  {t === "light" ? "Claro" : "Oscuro"}
                </Text>
                {prefs.theme === t && (
                  <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Preferencias de Generación</Text>

          <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
                <IconSymbol name="sparkles" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-sm">Vibración háptica</Text>
                <Text className="text-muted text-xs mt-1">Retroalimentación táctil en acciones</Text>
              </View>
            </View>
            <Switch
              value={prefs.vibrationEnabled}
              onValueChange={(value) => {
                void persistPrefs({ ...prefs, vibrationEnabled: value });
              }}
              accessibilityLabel="Vibración háptica"
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <SettingRow
            label={`Formato por defecto: ${prefs.defaultFormat}`}
            description="Pulsa para alternar entre SVG vectorial y PNG"
            icon="square.and.arrow.down"
            onPress={() => void handleToggleFormat()}
          />

          <SettingRow
            label={`Resolución base: ${prefs.defaultSize} px`}
            description="Pulsa para alternar entre 256, 320 y 512 px"
            icon="qrcode"
            onPress={() => void handleCycleSize()}
          />
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Seguridad y Privacidad</Text>
          <SettingRow
            label="Privacidad y Seguridad"
            description="AES-256-GCM, SHA-256, derechos RGPD"
            icon="lock.fill"
            onPress={() => router.push("/privacy-settings")}
          />
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold text-sm mb-3">Datos Locales</Text>
          <SettingRow
            label="Exportar historial (JSON)"
            description="Copia estructurada conforme al Art. 20 RGPD"
            icon="doc.on.doc"
            onPress={() => void handleExportHistory()}
          />

          <TouchableOpacity
            onPress={handleClearHistory}
            accessibilityRole="button"
            className="bg-surface rounded-xl p-4 border border-error flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-lg bg-error/15 items-center justify-center">
                <IconSymbol name="trash" size={20} color={colors.error} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.error }} className="font-semibold text-sm">
                  Limpiar historial
                </Text>
                <Text className="text-muted text-xs mt-1">Suprimir todos los QR guardados</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View className="mb-8">
          <Text className="text-foreground font-semibold text-sm mb-3">Acerca de</Text>
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-sm">Versión</Text>
              <Text className="text-foreground font-semibold text-sm">1.1.0 Enterprise</Text>
            </View>
            <View className="h-px bg-border" />
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-sm">Capacidad de Prompt / Secuencia</Text>
              <Text className="text-foreground font-semibold text-sm">Hasta 5.000 caracteres</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
