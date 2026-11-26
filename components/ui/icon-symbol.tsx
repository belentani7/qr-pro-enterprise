import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

const MAPPING = {
  "house.fill": "home",
  "qrcode": "qr-code-2",
  "qrcode.viewfinder": "qr-code-scanner",
  "clock.fill": "history",
  "star.fill": "star",
  "gear": "settings",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "square.and.arrow.down": "download",
  "square.and.arrow.up": "share",
  "heart": "favorite-border",
  "heart.fill": "favorite",
  "trash": "delete",
  "magnifyingglass": "search",
  "camera.fill": "camera-alt",
  "xmark": "close",
  "link": "link",
  "mail": "mail-outline",
  "phone": "phone",
  "person": "person-outline",
  "lock": "lock-outline",
  "lock.fill": "lock",
  "shield": "security",
  "eye": "visibility",
  "doc.text": "description",
  "doc.on.doc": "content-copy",
  "checkmark": "check",
  "photo.badge.plus": "add-photo-alternate",
  "pawprint": "pets",
  "circle.fill": "circle",
  "square.fill": "crop-square",
  "triangle.fill": "change-history",
  "diamond.fill": "diamond",
  "flower": "local-florist",
  "tree.fill": "park",
  "sparkles": "auto-awesome",
  "wifi": "wifi",
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
