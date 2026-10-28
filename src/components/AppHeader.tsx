import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from './Logo';
import { SCREEN_GUTTER } from '../theme/spacing';
import { MIN_TOUCH } from '../theme/touchTargets';

interface AppHeaderProps {
  /** True while the Saved Trips screen is showing: the bookmark button fills in. */
  savedActive: boolean;
  onPressSaved: () => void;
}

// Replaces Paper's Appbar.Header: logo lockup on the left, a round saved-trips
// button on the right. Same ground colour as the screen, so there is no bar.
export function AppHeader({ savedActive, onPressSaved }: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <View style={styles.row}>
        <Logo size={32} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saved trips"
          accessibilityState={{ selected: savedActive }}
          onPress={onPressSaved}
          style={[
            styles.button,
            savedActive
              ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              : { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
          ]}
        >
          <Icon
            source={savedActive ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={savedActive ? theme.colors.onPrimary : theme.colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    height: 56,
    paddingHorizontal: SCREEN_GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
