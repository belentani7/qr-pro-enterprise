import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface QRDecoration {
  name: string;
  type: "none" | "logo" | "frame" | "pattern";
  description: string;
}

export const QR_DECORATIONS: QRDecoration[] = [
  { name: "Sin decoración", type: "none", description: "QR limpio" },
  { name: "Logo Central", type: "logo", description: "Añade logo en el centro" },
  { name: "Marco Clásico", type: "frame", description: "Marco decorativo" },
  { name: "Marco Moderno", type: "frame", description: "Marco geométrico" },
  { name: "Patrón Puntos", type: "pattern", description: "Fondo con puntos" },
  { name: "Patrón Líneas", type: "pattern", description: "Fondo con líneas" },
];

interface QRDecorationSelectorProps {
  selectedDecoration: QRDecoration;
  onSelectDecoration: (decoration: QRDecoration) => void;
}

export function QRDecorationSelector({
  selectedDecoration,
  onSelectDecoration,
}: QRDecorationSelectorProps) {
  const colors = useColors();

  return (
    <View className="gap-3">
      <Text className="text-foreground font-semibold text-sm">Decoraciones</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        {QR_DECORATIONS.map((decoration) => (
          <TouchableOpacity
            key={decoration.name}
            onPress={() => onSelectDecoration(decoration)}
            style={{
              backgroundColor:
                selectedDecoration.name === decoration.name ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="rounded-lg p-3 min-w-28 active:opacity-80"
          >
            <Text
              style={{
                color: selectedDecoration.name === decoration.name ? "white" : colors.foreground,
              }}
              className="font-semibold text-xs"
            >
              {decoration.name}
            </Text>
            <Text
              style={{
                color:
                  selectedDecoration.name === decoration.name
                    ? "rgba(255,255,255,0.7)"
                    : colors.muted,
              }}
              className="text-xs mt-1"
            >
              {decoration.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
