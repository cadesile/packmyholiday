import React from 'react';
import { Text, type TextProps, useTheme } from 'react-native-paper';

// The Superr guide's "Marker Highlight": inline emphasis on a single word,
// rendered in Marker Orange with a hand-drawn-style underline in the same
// color. React Native has no wobble-stroke primitive, so this uses a plain
// underline as the closest native equivalent.
export function MarkerHighlight({ style, children, ...props }: TextProps<never>) {
  const theme = useTheme();
  return (
    <Text
      style={[
        { color: theme.colors.primary, textDecorationLine: 'underline', textDecorationColor: theme.colors.primary },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
