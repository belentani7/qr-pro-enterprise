import { ScrollView, Text, View, TouchableOpacity, Switch, Alert, Platform } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { copyTextToClipboard } from "@/lib/file-export";
import {
  getSecurityPolicy,
  updateGDPRConsent,
  deleteAllUserData,
  exportPortableUserData,
  generateSecurityReport,
  type SecurityPolicy,
} from "@/lib/security-service";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const currentPolicy = await getSecurityPolicy();
      setPolicy(currentPolicy);
    } catch (error) {
      console.error("Error loading policy:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGDPRToggle = async (value: boolean) => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const updated = await updateGDPRConsent(value);
      setPolicy(updated);
    } catch {
      Alert.alert("Error", "No se pudo actualizar la configuración");
    }
  };

  const handleExportPortableData = async () => {
    try {
      const json = await exportPortableUserData();
      await copyTextToClipboard(json);
      Alert.alert(
        "Portabilidad JSON lista",
        "Tus datos locales se han exportado y copiado al portapapeles en formato JSON estructurado (Art. 20 RGPD)."
      );
    } catch {
      Alert.alert("Error", "No se pudo exportar los datos");
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Eliminar todos los datos",
      "Esta acción eliminará permanentemente tu historial, favoritos y claves locales. No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (Platform.OS !== "web") {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              await deleteAllUserData();
              const fresh = await getSecurityPolicy();
              setPolicy(fresh);
              Alert.alert("Datos eliminados", "Se han suprimido todos los datos locales.");
            } catch {
              Alert.alert("Error", "No se pudo eliminar los datos");
            }
          },
        },
      ]
    );
  };

  const handleViewReport = async () => {
    try {
      const report = await generateSecurityReport();
      Alert.alert("Informe de Seguridad", report);
    } catch {
      Alert.alert("Error", "No se pudo generar el informe");
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Cargando configuración...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">Privacidad y Seguridad</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar ajustes de privacidad"
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-4">
          <Text className="text-lg font-bold text-foreground">Controles RGPD / LOPDGDD</Text>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-foreground font-semibold">Consentimiento de persistencia local</Text>
                <Text className="text-muted text-xs mt-1">
                  Autoriza guardar historial y favoritos localmente en este dispositivo
                </Text>
              </View>
              <Switch
                value={policy?.gdprConsent || false}
                onValueChange={handleGDPRToggle}
                accessibilityLabel="Consentimiento de persistencia local"
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-foreground font-semibold">Generación 100% Local</Text>
                <Text className="text-muted text-xs mt-1">
                  Los códigos QR y prompts de hasta 5.000 caracteres se procesan sin enviar PII a terceros
                </Text>
              </View>
              <View className="bg-success rounded-full p-2">
                <IconSymbol name="checkmark" size={16} color="white" />
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-foreground font-semibold">Cifrado Autenticado AES-256-GCM</Text>
                <Text className="text-muted text-xs mt-1">
                  Web Crypto API con IV aleatorio de 96 bits e integridad SHA-256
                </Text>
              </View>
              <View className="bg-success rounded-full p-2">
                <IconSymbol name="lock" size={16} color="white" />
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-4">
          <Text className="text-lg font-bold text-foreground">Derechos del Usuario</Text>

          <TouchableOpacity
            onPress={handleViewReport}
            accessibilityRole="button"
            style={{ backgroundColor: colors.primary }}
            className="py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
          >
            <IconSymbol name="doc.text" size={18} color="white" />
            <Text className="text-white font-semibold">Ver Informe Técnico de Seguridad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportPortableData}
            accessibilityRole="button"
            className="py-3 rounded-lg items-center flex-row justify-center gap-2 bg-background border border-border active:opacity-80"
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.foreground} />
            <Text className="text-foreground font-semibold">Exportar Datos en JSON (Art. 20 RGPD)</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6 bg-surface rounded-2xl p-4 border border-error gap-4">
          <Text className="text-lg font-bold text-error">Zona de Supresión Definitiva</Text>

          <TouchableOpacity
            onPress={handleDeleteAllData}
            accessibilityRole="button"
            style={{ backgroundColor: "#DC2626" }}
            className="py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
          >
            <IconSymbol name="trash" size={18} color="white" />
            <Text className="text-white font-semibold">Eliminar Todos los Datos Locales</Text>
          </TouchableOpacity>

          <Text className="text-muted text-xs">
            Suprime permanentemente historial, favoritos y claves de cifrado locales (Art. 17 RGPD).
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
