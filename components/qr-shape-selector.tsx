import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface QRShape {
  name: string;
  type: "square" | "circle" | "diamond" | "rounded" | "organic";
  description: string;
}

export const QR_SHAPES: QRShape[] = [
  { name: "Cuadrado", type: "square", description: "Clásico" },
  { name: "Círculo", type: "circle", description: "Moderno" },
  { name: "Diamante", type: "diamond", description: "Elegante" },
  { name: "Redondeado", type: "rounded", description: "Suave" },
  { name: "Orgánico", type: "organic", description: "Artístico" },
];

interface QRShapeSelectorProps {
  selectedShape: QRShape;
  onSelectShape: (shape: QRShape) => void;
}

export function QRShapeSelector({ selectedShape, onSelectShape }: QRShapeSelectorProps) {
  const colors = useColors();

  const getShapePreview = (type: string) => {
    switch (type) {
      case "square":
        return <View style={{ width: 40, height: 40, backgroundColor: colors.primary }} />;
      case "circle":
        return (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
            }}
          />
        );
      case "diamond":
        return (
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: colors.primary,
              transform: [{ rotate: "45deg" }],
            }}
          />
        );
      case "rounded":
        return (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.primary,
            }}
          />
        );
      case "organic":
        return (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 15,
              backgroundColor: colors.primary,
              opacity: 0.8,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View className="gap-3">
      <Text className="text-foreground font-semibold text-sm">Forma del QR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        {QR_SHAPES.map((shape) => (
          <TouchableOpacity
            key={shape.type}
            onPress={() => onSelectShape(shape)}
            style={{
              backgroundColor: selectedShape.type === shape.type ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="rounded-lg p-3 min-w-28 items-center gap-2 active:opacity-80"
          >
            <View className="items-center justify-center h-12">
              {getShapePreview(shape.type)}
            </View>
            <Text
              style={{
                color: selectedShape.type === shape.type ? "white" : colors.foreground,
              }}
              className="font-semibold text-xs text-center"
            >
              {shape.name}
            </Text>
            <Text
              style={{
                color: selectedShape.type === shape.type ? "rgba(255,255,255,0.7)" : colors.muted,
              }}
              className="text-xs"
            >
              {shape.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
