import { Text, View, FlatList, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useQRStorage, type StoredQR } from "@/hooks/use-qr-storage";
import { copyTextToClipboard } from "@/lib/file-export";
import * as Haptics from "expo-haptics";

export default function HistoryScreen() {
  const colors = useColors();
  const { searchHistory, deleteFromHistory } = useQRStorage();
  const [activeTab, setActiveTab] = useState<"generated" | "scanned">("generated");
  const [searchText, setSearchText] = useState("");

  const filteredHistory = searchHistory(searchText).filter((item) => item.type === activeTab);

  const handleDelete = async (id: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await deleteFromHistory(id);
  };

  const handleCopy = async (content: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const ok = await copyTextToClipboard(content);
    if (ok) {
      Alert.alert("Copiado", "Contenido copiado al portapapeles");
    }
  };

  const renderHistoryItem = ({ item }: { item: StoredQR }) => (
    <View className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-foreground font-semibold text-sm mb-1">{item.qrType}</Text>
        <Text className="text-muted text-xs" numberOfLines={2}>
          {item.content}
        </Text>
        <Text className="text-muted text-xs mt-1">
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      <View className="flex-row gap-2 ml-4">
        <TouchableOpacity
          onPress={() => void handleCopy(item.content)}
          accessibilityRole="button"
          accessibilityLabel="Copiar contenido del QR"
          className="p-2 rounded-lg bg-primary/10"
        >
          <IconSymbol name="doc.on.doc" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => void handleDelete(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Eliminar del historial"
          className="p-2 rounded-lg bg-error/10"
        >
          <IconSymbol name="trash" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="bg-background px-4 py-4">
      <View className="mb-4 flex-row items-center gap-2 bg-surface rounded-full px-4 py-2 border border-border">
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          placeholder="Buscar en historial..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
          accessibilityLabel="Buscar en historial"
          className="flex-1 text-foreground"
        />
      </View>

      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab("generated")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "generated" }}
          style={{
            backgroundColor: activeTab === "generated" ? colors.primary : colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
          className="flex-1 py-2 rounded-lg items-center"
        >
          <Text
            style={{
              color: activeTab === "generated" ? "white" : colors.foreground,
            }}
            className="font-semibold text-sm"
          >
            Generados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("scanned")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "scanned" }}
          style={{
            backgroundColor: activeTab === "scanned" ? colors.primary : colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
          className="flex-1 py-2 rounded-lg items-center"
        >
          <Text
            style={{
              color: activeTab === "scanned" ? "white" : colors.foreground,
            }}
            className="font-semibold text-sm"
          >
            Escaneados
          </Text>
        </TouchableOpacity>
      </View>

      {filteredHistory.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
            <IconSymbol name="clock.fill" size={32} color={colors.primary} />
          </View>
          <Text className="text-foreground font-semibold">Sin historial</Text>
          <Text className="text-muted text-sm text-center">
            Los QR {activeTab === "generated" ? "generados" : "escaneados"} aparecerán aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </ScreenContainer>
  );
}
