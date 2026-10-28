import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Switch, Text, useTheme } from 'react-native-paper';
import { SectionLabel } from '../../components/SectionLabel';
import { SegmentedControl } from '../../components/SegmentedControl';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { useTripStore } from '../../state/useTripStore';
import { INTER_FAMILY } from '../../theme/fonts';
import { RADII } from '../../theme/radii';
import type { ToiletryStrategy } from '../../types/packing';

const TOILETRY_OPTIONS: { value: ToiletryStrategy; label: string }[] = [
  { value: 'pack', label: 'Pack liquids' },
  { value: 'buy_on_arrival', label: 'Buy on arrival' },
];

export function Step4HealthHygiene() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const updateDraftConfig = useTripStore((s) => s.updateDraftConfig);
  const nextStep = useTripStore((s) => s.nextStep);
  const prevStep = useTripStore((s) => s.prevStep);
  const theme = useTheme();

  const requiresBugSpray =
    draftConfig.climate === 'warm' || draftConfig.climate === 'rainy' || draftConfig.activities.includes('hiking');

  const card = { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant };

  return (
    <WizardStepLayout
      title="Health, hygiene & logistics"
      stepName="Health & hygiene"
      stepNumber={4}
      totalSteps={5}
      onBack={prevStep}
      onNext={nextStep}
    >
      <View style={styles.group}>
        <SectionLabel>Toiletry strategy</SectionLabel>
        <SegmentedControl
          height={48}
          value={draftConfig.toiletryStrategy}
          options={TOILETRY_OPTIONS}
          onChange={(value) => updateDraftConfig({ toiletryStrategy: value })}
        />
      </View>

      <View style={[styles.card, card]}>
        <View style={[styles.switchRow, { borderBottomColor: theme.colors.outlineVariant, borderBottomWidth: 1 }]}>
          <Text variant="bodyLarge" style={styles.switchTitle}>
            Laundry available midway
          </Text>
          <Switch
            value={draftConfig.laundryAvailable}
            color={theme.colors.primary}
            onValueChange={(value) => updateDraftConfig({ laundryAvailable: value })}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelGroup}>
            <Text variant="bodyLarge" style={styles.switchTitle}>
              Reuse some clothing
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pack fewer clothes, assuming some items get worn more than once.
            </Text>
          </View>
          <Switch
            value={draftConfig.reuseClothing}
            color={theme.colors.primary}
            onValueChange={(value) => updateDraftConfig({ reuseClothing: value })}
          />
        </View>
      </View>

      <View style={styles.group}>
        <SectionLabel>Health advisory</SectionLabel>
        <View style={[styles.card, card]}>
          <AdvisoryRow
            icon="bug-outline"
            title="Insect repellent"
            description={requiresBugSpray ? 'Recommended for this climate and activity mix.' : 'Not flagged for this trip.'}
            divider
          />
          <AdvisoryRow
            icon="cup-water"
            title="Tap water safety"
            description="Check local advisories before drinking tap water at your destination."
            divider
          />
          <AdvisoryRow
            icon="needle"
            title="Vaccine advisories"
            description="Check NHS or CDC travel health advisories well ahead of departure."
          />
        </View>
      </View>
    </WizardStepLayout>
  );
}

function AdvisoryRow({
  icon,
  title,
  description,
  divider,
}: {
  icon: string;
  title: string;
  description: string;
  divider?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.advisoryRow, divider && { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }]}
    >
      <View style={[styles.advisoryIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon source={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.switchLabelGroup}>
        <Text variant="bodyLarge" style={styles.switchTitle}>
          {title}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADII.cards,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    minHeight: 44,
  },
  switchLabelGroup: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontFamily: INTER_FAMILY.semibold,
  },
  advisoryRow: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  advisoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
