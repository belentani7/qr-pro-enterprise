import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface ColorPickerSectionProps {
  darkColor: string;
  lightColor: string;
  onDarkColorChange: (color: string) => void;
  onLightColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  "#000000", // Negro
  "#0066CC", // Azul
  "#FF3B30", // Rojo
  "#34C759", // Verde
  "#FF9500", // Naranja
  "#9B59B6", // Púrpura
  "#1ABC9C", // Turquesa
  "#E74C3C", // Rojo oscuro
];

export function ColorPickerSection({
  darkColor,
  lightColor,
  onDarkColorChange,
  onLightColorChange,
}: ColorPickerSectionProps) {
  const colors = useColors();

  const ColorOption = ({
    color,
    selected,
    onPress,
  }: {
    color: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 48,
        height: 48,
        backgroundColor: color,
        borderRadius: 8,
        borderWidth: selected ? 3 : 0,
        borderColor: colors.foreground,
      }}
    />
  );

  return (
    <View className="gap-4">
      {/* Dark Color (QR Modules) */}
      <View>
        <Text className="text-foreground font-semibold text-sm mb-3">Color del QR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {PRESET_COLORS.map((color) => (
            <ColorOption
              key={`dark-${color}`}
              color={color}
              selected={darkColor === color}
              onPress={() => onDarkColorChange(color)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Light Color (Background) */}
      <View>
        <Text className="text-foreground font-semibold text-sm mb-3">Color de fondo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {PRESET_COLORS.map((color) => (
            <ColorOption
              key={`light-${color}`}
              color={color}
              selected={lightColor === color}
              onPress={() => onLightColorChange(color)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Color Preview */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-muted text-xs mb-2">Vista previa</Text>
          <View
            style={{
              backgroundColor: lightColor,
              borderColor: darkColor,
              borderWidth: 2,
            }}
            className="rounded-lg p-4 items-center justify-center h-20"
          >
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: darkColor,
              }}
              className="rounded"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
