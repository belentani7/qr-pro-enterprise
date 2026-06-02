import { ScrollView, Text, View, TouchableOpacity, Switch, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import {
  getSecurityPolicy,
  updateGDPRConsent,
  deleteAllUserData,
  generateSecurityReport,
  type SecurityPolicy,
} from "@/lib/security-service";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicy();
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateGDPRConsent(value);
      setPolicy((prev) => (prev ? { ...prev, gdprConsent: value } : null));
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la configuración");
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Eliminar todos los datos",
      "Esta acción eliminará permanentemente todos tus QR, historial y favoritos. No se puede deshacer.",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteAllUserData();
              Alert.alert("Éxito", "Todos tus datos han sido eliminados (Derecho al olvido GDPR)");
              setPolicy(null);
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar los datos");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleViewReport = async () => {
    try {
      const report = await generateSecurityReport();
      Alert.alert("Reporte de Seguridad", report);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el reporte");
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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">Privacidad y Seguridad</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg bg-surface border border-border"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* GDPR Section */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-4">
          <Text className="text-lg font-bold text-foreground">Cumplimiento GDPR/RGPD</Text>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Consentimiento GDPR</Text>
                <Text className="text-muted text-xs mt-1">
                  Acepta nuestro cumplimiento con regulaciones europeas
                </Text>
              </View>
              <Switch
                value={policy?.gdprConsent || false}
                onValueChange={handleGDPRToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Recopilación de Datos</Text>
                <Text className="text-muted text-xs mt-1">
                  Solo datos locales, sin envío a servidores
                </Text>
              </View>
              <View className="bg-success rounded-full p-2">
                <IconSymbol name="checkmark" size={16} color="white" />
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Encriptación Local</Text>
                <Text className="text-muted text-xs mt-1">
                  Todos los datos encriptados en el dispositivo
                </Text>
              </View>
              <View className="bg-success rounded-full p-2">
                <IconSymbol name="lock" size={16} color="white" />
              </View>
            </View>
          </View>
        </View>

        {/* Data Protection Section */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-4">
          <Text className="text-lg font-bold text-foreground">Protección de Datos</Text>

          <View className="gap-3">
            <View className="flex-row items-start gap-3">
              <View className="bg-primary rounded-full p-2 mt-1">
                <IconSymbol name="shield" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Hash de Integridad</Text>
                <Text className="text-muted text-xs">
                  Cada QR tiene un hash único para verificar autenticidad
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <View className="bg-primary rounded-full p-2 mt-1">
                <IconSymbol name="eye" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Watermark Invisible</Text>
                <Text className="text-muted text-xs">
                  Protección contra copia no autorizada de QR
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <View className="bg-primary rounded-full p-2 mt-1">
                <IconSymbol name="lock.fill" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Encriptación TLS 1.3+</Text>
                <Text className="text-muted text-xs">
                  Comunicación segura en tránsito
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Rights Section */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-4">
          <Text className="text-lg font-bold text-foreground">Derechos del Usuario</Text>

          <TouchableOpacity
            onPress={handleViewReport}
            style={{ backgroundColor: colors.primary }}
            className="py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
          >
            <IconSymbol name="doc.text" size={18} color="white" />
            <Text className="text-white font-semibold">Ver Reporte de Seguridad</Text>
          </TouchableOpacity>

          <View className="gap-2 text-xs text-muted">
            <Text className="text-muted text-xs">
              ✓ <Text className="font-semibold">Derecho al Olvido:</Text> Elimina todos tus datos
            </Text>
            <Text className="text-muted text-xs">
              ✓ <Text className="font-semibold">Portabilidad:</Text> Accede a tus datos
            </Text>
            <Text className="text-muted text-xs">
              ✓ <Text className="font-semibold">Rectificación:</Text> Corrige tus datos
            </Text>
            <Text className="text-muted text-xs">
              ✓ <Text className="font-semibold">Acceso:</Text> Consulta qué datos tenemos
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-6 bg-error rounded-2xl p-4 gap-4 opacity-20">
          <Text className="text-lg font-bold text-error">Zona de Peligro</Text>

          <TouchableOpacity
            onPress={handleDeleteAllData}
            style={{ backgroundColor: "#EF4444" }}
            className="py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
          >
            <IconSymbol name="trash" size={18} color="white" />
            <Text className="text-white font-semibold">Eliminar Todos los Datos</Text>
          </TouchableOpacity>

          <Text className="text-muted text-xs">
            Esta acción elimina permanentemente todos tus QR, historial y favoritos (Derecho al
            olvido GDPR). No se puede deshacer.
          </Text>
        </View>

        {/* Privacy Policy */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-3">
          <Text className="text-foreground font-semibold">Política de Privacidad</Text>
          <Text className="text-muted text-xs leading-relaxed">
            QR Pro Generator respeta tu privacidad. No recopilamos datos personales sin tu
            consentimiento explícito. Todos los datos se almacenan localmente en tu dispositivo y
            se encriptan automáticamente. Cumplimos con GDPR, RGPD y otras regulaciones europeas
            de protección de datos.
          </Text>
        </View>

        {/* Version Info */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-2">
          <Text className="text-muted text-xs">Versión de Política: {policy?.version}</Text>
          <Text className="text-muted text-xs">
            Última actualización: {policy?.lastConsentDate ? new Date(policy.lastConsentDate).toLocaleDateString() : "N/A"}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
