import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface ColorPalette {
  name: string;
  dark: string;
  light: string;
  icon?: string;
}

export const PREDEFINED_PALETTES: ColorPalette[] = [
  { name: "Clásico", dark: "#000000", light: "#FFFFFF" },
  { name: "Azul Pro", dark: "#0066CC", light: "#E6F4FE" },
  { name: "Neon Rosa", dark: "#FF006E", light: "#FFF0F6" },
  { name: "Neon Verde", dark: "#00FF00", light: "#F0FFF0" },
  { name: "Neon Púrpura", dark: "#9D00FF", light: "#F5F0FF" },
  { name: "Neon Naranja", dark: "#FF6B00", light: "#FFF5F0" },
  { name: "Pastel Azul", dark: "#4A90E2", light: "#E8F4FD" },
  { name: "Pastel Rosa", dark: "#E294B5", light: "#FDE8F0" },
  { name: "Pastel Verde", dark: "#7ED321", light: "#F0FDE8" },
  { name: "Pastel Amarillo", dark: "#F5A623", light: "#FFFDE8" },
  { name: "Oscuro", dark: "#1A1A1A", light: "#F5F5F5" },
  { name: "Monocromático", dark: "#333333", light: "#CCCCCC" },
  { name: "Rojo Vibrante", dark: "#E63946", light: "#FCE8E8" },
  { name: "Verde Esmeralda", dark: "#06A77D", light: "#E8F9F5" },
  { name: "Azul Marino", dark: "#001F3F", light: "#E6F0FF" },
  { name: "Dorado", dark: "#B8860B", light: "#FFF8DC" },
];

interface ColorPaletteSelectorProps {
  selectedPalette: ColorPalette;
  onSelectPalette: (palette: ColorPalette) => void;
}

export function ColorPaletteSelector({
  selectedPalette,
  onSelectPalette,
}: ColorPaletteSelectorProps) {
  const colors = useColors();

  return (
    <View className="gap-3">
      <Text className="text-foreground font-semibold text-sm">Paletas de Colores</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-2"
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {PREDEFINED_PALETTES.map((palette) => (
          <TouchableOpacity
            key={palette.name}
            onPress={() => onSelectPalette(palette)}
            className="items-center gap-2"
          >
            <View
              style={{
                borderWidth: selectedPalette.name === palette.name ? 3 : 0,
                borderColor: colors.primary,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  flexDirection: "row",
                  borderRadius: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: palette.dark,
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    backgroundColor: palette.light,
                  }}
                />
              </View>
            </View>
            <Text className="text-muted text-xs text-center" style={{ width: 60 }}>
              {palette.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
