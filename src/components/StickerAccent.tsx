import React from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import { STICKER_COLORS } from '../theme/paperTheme';

interface StickerAccentProps {
  icon: string;
  color?: keyof typeof STICKER_COLORS;
  size?: number;
  /** Degrees, matching the guide's "placed by hand" 5-15° range. */
  rotation?: number;
}

// The Superr guide's illustrated stickers (lightning bolt, bear, heart, ghost,
// cat) are flat 2px-outline characters with no equivalent asset in this app.
// This reinterprets that personality using existing MaterialCommunityIcons
// glyphs (via react-native-paper's Icon), tinted in the sticker palette and
// rotated — decorative only, never used for functional UI per the guide's
// own rule.
export function StickerAccent({ icon, color = 'sky', size = 28, rotation = 8 }: StickerAccentProps) {
  return (
    <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
      <Icon source={icon} size={size} color={STICKER_COLORS[color]} />
    </View>
  );
}
