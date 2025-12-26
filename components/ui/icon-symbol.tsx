// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle, Text } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = "house.fill" | "paperplane.fill" | "chevron.left.forwardslash.chevron.right" | "chevron.right" | "chart.bar.fill" | "checkmark.square.fill" | "gearshape.fill";

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: Record<IconSymbolName, ComponentProps<typeof MaterialIcons>["name"]> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chart.bar.fill": "bar-chart",
  "checkmark.square.fill": "check",
  "gearshape.fill": "settings",
};

// Web用のテキストフォールバック
const TEXT_FALLBACK: Record<IconSymbolName, string> = {
  "house.fill": "🏠",
  "paperplane.fill": "📤",
  "chevron.left.forwardslash.chevron.right": "< />",
  "chevron.right": "›",
  "chart.bar.fill": "📊",
  "checkmark.square.fill": "☑️",
  "gearshape.fill": "⚙️",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
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
  // Web環境ではMaterialIconsが表示されない場合があるため、絵文字をフォールバックとして使用
  if (Platform.OS === 'web') {
    return (
      <Text style={[{ fontSize: size, color: color as string }, style]}>
        {TEXT_FALLBACK[name]}
      </Text>
    );
  }

  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
