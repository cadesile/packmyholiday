import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { RADII } from '../theme/radii';

interface InfoBannerProps {
  children: string;
}

/** Sun-tinted note with an info icon (e.g. the airline allowance on Step 5). */
export function InfoBanner({ children }: InfoBannerProps) {
  const theme = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer }]}>
      <View style={styles.icon}>
        <Icon source="information-outline" size={22} color={theme.colors.onSecondaryContainer} />
      </View>
      <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSecondaryContainer }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: RADII.buttons,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
