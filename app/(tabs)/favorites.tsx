import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useQRStorage } from "@/hooks/use-qr-storage";
import * as Haptics from "expo-haptics";

export default function FavoritesScreen() {
  const colors = useColors();
  const { favorites, toggleFavorite } = useQRStorage();

  const handleDelete = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(id);
  };

  const handleShare = async (content: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Compartir QR
  };

  const renderFavoriteItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-sm mb-1">{item.qrType}</Text>
          <Text className="text-muted text-xs" numberOfLines={2}>
            {item.content}
          </Text>
        </View>
        <View className="w-12 h-12 rounded-lg bg-primary bg-opacity-10 items-center justify-center ml-2">
          <IconSymbol name="qrcode" size={24} color={colors.primary} />
        </View>
      </View>

      <View className="flex-row gap-2 pt-3 border-t border-border">
        <TouchableOpacity
          onPress={() => handleShare(item.content)}
          className="flex-1 py-2 rounded-lg bg-primary bg-opacity-10 items-center flex-row justify-center gap-1"
        >
          <IconSymbol name="square.and.arrow.up" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="font-semibold text-xs">
            Compartir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          className="flex-1 py-2 rounded-lg bg-error bg-opacity-10 items-center flex-row justify-center gap-1"
        >
          <IconSymbol name="trash" size={16} color={colors.error} />
          <Text style={{ color: colors.error }} className="font-semibold text-xs">
            Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="bg-background px-4 py-4">
      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <View className="w-16 h-16 rounded-full bg-primary bg-opacity-10 items-center justify-center">
            <IconSymbol name="star.fill" size={32} color={colors.primary} />
          </View>
          <Text className="text-foreground font-semibold">Sin favoritos</Text>
          <Text className="text-muted text-sm text-center">
            Marca tus QR favoritos para acceder rápidamente
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </ScreenContainer>
  );
}
