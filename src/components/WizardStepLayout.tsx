import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { StepProgressDots } from './StepProgressDots';
import { StickerAccent } from './StickerAccent';
import { PillButton } from './PillButton';
import { RADII } from '../theme/radii';
import { SPACING } from '../theme/spacing';
import { STICKER_COLORS } from '../theme/paperTheme';

interface WizardStepLayoutProps {
  title: string;
  stepNumber: number;
  totalSteps: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  /** MaterialCommunityIcons glyph shown as a rotated sticker accent beside the title. */
  stickerIcon?: string;
  stickerColor?: keyof typeof STICKER_COLORS;
}

export function WizardStepLayout({
  title,
  stepNumber,
  totalSteps,
  children,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'Next',
  stickerIcon,
  stickerColor,
}: WizardStepLayoutProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.progressWrap}>
        <StepProgressDots currentStep={stepNumber} totalSteps={totalSteps} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleRow}>
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
          {stickerIcon ? <StickerAccent icon={stickerIcon} color={stickerColor} /> : null}
        </View>
        {children}
      </ScrollView>
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.primary }]}>
        {onBack ? (
          <PillButton onPress={onBack} style={styles.navButton}>
            Back
          </PillButton>
        ) : (
          <View style={styles.navButton} />
        )}
        <PillButton onPress={onNext} disabled={nextDisabled} style={styles.navButton}>
          {nextLabel}
        </PillButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    borderTopLeftRadius: RADII.footer,
    borderTopRightRadius: RADII.footer,
  },
  navButton: {
    flex: 1,
  },
});
