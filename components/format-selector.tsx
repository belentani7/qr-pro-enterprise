import { View, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export type QRFormat = "PNG" | "JPG" | "SVG";

interface FormatSelectorProps {
  selectedFormat: QRFormat;
  onSelectFormat: (format: QRFormat) => void;
}

const FORMATS: { format: QRFormat; label: string; description: string; icon: string }[] = [
  {
    format: "PNG",
    label: "PNG",
    description: "Transparencia, máxima calidad",
    icon: "photo",
  },
  {
    format: "JPG",
    label: "JPG",
    description: "Comprimido, menor tamaño",
    icon: "photo.fill",
  },
  {
    format: "SVG",
    label: "SVG",
    description: "Vectorial, escalable",
    icon: "square.and.pencil",
  },
];

export function FormatSelector({ selectedFormat, onSelectFormat }: FormatSelectorProps) {
  const colors = useColors();

  return (
    <View className="gap-3">
      <Text className="text-foreground font-semibold text-sm">Formato de Exportación</Text>
      <View className="flex-row gap-2">
        {FORMATS.map((item) => (
          <TouchableOpacity
            key={item.format}
            onPress={() => onSelectFormat(item.format)}
            style={{
              backgroundColor: selectedFormat === item.format ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            className="flex-1 rounded-lg p-3 items-center gap-2 active:opacity-80"
          >
            <IconSymbol
              name={item.icon as any}
              size={20}
              color={selectedFormat === item.format ? "white" : colors.foreground}
            />
            <Text
              style={{
                color: selectedFormat === item.format ? "white" : colors.foreground,
              }}
              className="font-semibold text-sm"
            >
              {item.label}
            </Text>
            <Text
              style={{
                color: selectedFormat === item.format ? "rgba(255,255,255,0.7)" : colors.muted,
              }}
              className="text-xs text-center"
            >
              {item.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
