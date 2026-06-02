import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface QRPattern {
  name: string;
  type: "none" | "dots" | "lines" | "flowers" | "stars" | "snowflakes" | "geometric";
  description: string;
}

export const QR_PATTERNS: QRPattern[] = [
  { name: "Sin patrón", type: "none", description: "Limpio" },
  { name: "Puntos", type: "dots", description: "Punteado" },
  { name: "Líneas", type: "lines", description: "Rayado" },
  { name: "Flores", type: "flowers", description: "Floral" },
  { name: "Estrellas", type: "stars", description: "Celestial" },
  { name: "Copos", type: "snowflakes", description: "Invernal" },
  { name: "Geométrico", type: "geometric", description: "Moderno" },
];

interface QRPatternSelectorProps {
  selectedPattern: QRPattern;
  onSelectPattern: (pattern: QRPattern) => void;
}

export function QRPatternSelector({
  selectedPattern,
  onSelectPattern,
}: QRPatternSelectorProps) {
  const colors = useColors();

  const getPatternPreview = (type: string) => {
    const previewSize = 30;
    const dotSize = 3;
    const dotSpacing = 6;

    switch (type) {
      case "dots":
        return (
          <View
            style={{
              width: previewSize,
              height: previewSize,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {[...Array(9)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: colors.primary,
                  opacity: 0.6,
                }}
              />
            ))}
          </View>
        );
      case "lines":
        return (
          <View style={{ width: previewSize, height: previewSize, gap: 2 }}>
            {[...Array(4)].map((_, i) => (
              <View
                key={i}
                style={{
                  height: 1,
                  backgroundColor: colors.primary,
                  opacity: 0.6,
                }}
              />
            ))}
          </View>
        );
      case "flowers":
        return (
          <View style={{ width: previewSize, height: previewSize, justifyContent: "center", alignItems: "center" }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.primary,
                  opacity: 0.6,
                  transform: [
                    {
                      translateX: Math.cos((i * Math.PI * 2) / 5) * 8,
                    },
                    {
                      translateY: Math.sin((i * Math.PI * 2) / 5) * 8,
                    },
                  ],
                }}
              />
            ))}
          </View>
        );
      case "stars":
        return (
          <View style={{ width: previewSize, height: previewSize, justifyContent: "center", alignItems: "center" }}>
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: colors.primary,
                  opacity: 0.7,
                  transform: [
                    {
                      translateX: Math.cos((i * Math.PI * 2) / 6) * 10,
                    },
                    {
                      translateY: Math.sin((i * Math.PI * 2) / 6) * 10,
                    },
                  ],
                }}
              />
            ))}
          </View>
        );
      case "geometric":
        return (
          <View style={{ width: previewSize, height: previewSize, gap: 1 }}>
            <View style={{ flexDirection: "row", gap: 1 }}>
              <View style={{ width: 8, height: 8, backgroundColor: colors.primary, opacity: 0.6 }} />
              <View style={{ width: 8, height: 8, backgroundColor: colors.primary, opacity: 0.4 }} />
            </View>
            <View style={{ flexDirection: "row", gap: 1 }}>
              <View style={{ width: 8, height: 8, backgroundColor: colors.primary, opacity: 0.4 }} />
              <View style={{ width: 8, height: 8, backgroundColor: colors.primary, opacity: 0.6 }} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="gap-3">
      <Text className="text-foreground font-semibold text-sm">Patrón Decorativo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        {QR_PATTERNS.map((pattern) => (
          <TouchableOpacity
            key={pattern.type}
            onPress={() => onSelectPattern(pattern)}
            style={{
              backgroundColor:
                selectedPattern.type === pattern.type ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="rounded-lg p-3 min-w-28 items-center gap-2 active:opacity-80"
          >
            <View className="items-center justify-center h-12">
              {getPatternPreview(pattern.type)}
            </View>
            <Text
              style={{
                color: selectedPattern.type === pattern.type ? "white" : colors.foreground,
              }}
              className="font-semibold text-xs text-center"
            >
              {pattern.name}
            </Text>
            <Text
              style={{
                color:
                  selectedPattern.type === pattern.type
                    ? "rgba(255,255,255,0.7)"
                    : colors.muted,
              }}
              className="text-xs"
            >
              {pattern.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
