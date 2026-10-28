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
      "Se borrarán los datos locales de QR Pro en este dispositivo. No se eliminan datos ya enviados a QR Server. No se puede deshacer.",
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteAllUserData();
              Alert.alert("Éxito", "Se borraron los datos locales de QR Pro. La app no puede borrar los datos ya enviados a QR Server.");
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
          <Text className="text-lg font-bold text-foreground">Preferencias de privacidad</Text>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Preferencia local de privacidad</Text>
                <Text className="text-muted text-xs mt-1">
                  Este ajuste no certifica cumplimiento RGPD ni autoriza envíos a QR Server.
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
                <Text className="text-foreground font-semibold">Generación con proveedor externo</Text>
                <Text className="text-muted text-xs mt-1">
                  Al autorizar generar un QR, el texto se envía a QR Server.
                </Text>
              </View>
              <View className="rounded-lg border border-warning p-2">
                <Text className="text-warning text-xs font-semibold">Externo</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Almacenamiento local</Text>
                <Text className="text-muted text-xs mt-1">
                  AsyncStorage no incorpora cifrado de contenido propio de esta app.
                </Text>
              </View>
              <View className="rounded-lg border border-warning p-2">
                <Text className="text-warning text-xs font-semibold">Sin cifrar</Text>
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
                <Text className="text-foreground font-semibold">Suma de comprobación</Text>
                <Text className="text-muted text-xs">
                  FNV-1a detecta cambios accidentales; no acredita autenticidad ni autoría.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <View className="bg-primary rounded-full p-2 mt-1">
                <IconSymbol name="eye" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Marca de agua no implementada</Text>
                <Text className="text-muted text-xs">
                  Solo existe una etiqueta de metadatos; no se modifica la imagen.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <View className="bg-primary rounded-full p-2 mt-1">
                <IconSymbol name="lock.fill" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Transporte HTTPS externo</Text>
                <Text className="text-muted text-xs">
                  La versión TLS depende del proveedor y no está verificada aquí.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Rights Section */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-4">
          <Text className="text-lg font-bold text-foreground">Opciones de datos locales</Text>

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
              ✓ <Text className="font-semibold">Borrado local:</Text> Elimina el historial, favoritos y preferencias de esta app
            </Text>
            <Text className="text-muted text-xs">
              ✓ <Text className="font-semibold">Exportación:</Text> No implementada en esta pantalla
            </Text>
            <Text className="text-muted text-xs">
              ✓ <Text className="font-semibold">Proveedor externo:</Text> No se borran datos ya enviados a QR Server
            </Text>
            <Text className="text-muted text-xs">
              ✓ <Text className="font-semibold">Acceso local:</Text> Consulta los datos guardados en la app
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-6 bg-surface border border-error rounded-2xl p-4 gap-4">
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
            Elimina los datos locales de QR Pro. No borra información que ya haya
            recibido QR Server. No se puede deshacer.
          </Text>
        </View>

        {/* Privacy Policy */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border gap-3">
          <Text className="text-foreground font-semibold">Política de Privacidad</Text>
          <Text className="text-muted text-xs leading-relaxed">
            El historial y las preferencias se guardan localmente en AsyncStorage sin cifrado
            propio. Si autorizas generar un QR, el texto o enlace se envía a QR Server y puede
            conservarse según sus políticas. La aplicación no controla su retención ni certifica
            cumplimiento RGPD.
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
