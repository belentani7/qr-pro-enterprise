import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface QRStyle {
  name: string;
  description: string;
  roundedCorners: boolean;
  border: boolean;
  shadow: boolean;
}

export const QR_STYLES: QRStyle[] = [
  {
    name: "Clásico",
    description: "Estilo tradicional",
    roundedCorners: false,
    border: false,
    shadow: false,
  },
  {
    name: "Moderno",
    description: "Esquinas redondeadas",
    roundedCorners: true,
    border: false,
    shadow: false,
  },
  {
    name: "Con Marco",
    description: "Marco decorativo",
    roundedCorners: true,
    border: true,
    shadow: false,
  },
  {
    name: "Elegante",
    description: "Con sombra",
    roundedCorners: true,
    border: true,
    shadow: true,
  },
];

interface QRStyleSelectorProps {
  selectedStyle: QRStyle;
  onSelectStyle: (style: QRStyle) => void;
}

export function QRStyleSelector({ selectedStyle, onSelectStyle }: QRStyleSelectorProps) {
  const colors = useColors();

  return (
    <View className="gap-3">
      <Text className="text-foreground font-semibold text-sm">Estilo del QR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        {QR_STYLES.map((style) => (
          <TouchableOpacity
            key={style.name}
            onPress={() => onSelectStyle(style)}
            style={{
              backgroundColor: selectedStyle.name === style.name ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="rounded-lg p-3 min-w-32 active:opacity-80"
          >
            <Text
              style={{
                color: selectedStyle.name === style.name ? "white" : colors.foreground,
              }}
              className="font-semibold text-sm"
            >
              {style.name}
            </Text>
            <Text
              style={{
                color: selectedStyle.name === style.name ? "rgba(255,255,255,0.7)" : colors.muted,
              }}
              className="text-xs mt-1"
            >
              {style.description}
            </Text>

            {/* Style Preview */}
            <View className="mt-2 items-center">
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: colors.primary,
                  borderRadius: style.roundedCorners ? 8 : 0,
                  borderWidth: style.border ? 2 : 0,
                  borderColor: "white",
                  opacity: 0.6,
                }}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
