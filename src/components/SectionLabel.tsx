import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface SectionLabelProps {
  children: string;
}

/** Small uppercase label that sits above a field or group ("TRIP DATES"). */
export function SectionLabel({ children }: SectionLabelProps) {
  const theme = useTheme();
  return (
    <Text variant="labelMedium" accessibilityRole="header" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    textTransform: 'uppercase',
  },
});
