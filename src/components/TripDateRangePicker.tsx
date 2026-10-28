// src/components/TripDateRangePicker.tsx
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { INTER_FAMILY } from '../theme/fonts';
import { RADII } from '../theme/radii';
import { CONTROL_HEIGHT } from '../theme/spacing';
import { formatDisplayDate, parseISODate, toISODateString } from '../utils/tripDates';
import { AppButton } from './AppButton';

interface TripDateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

type ActivePicker = 'start' | 'end' | null;

export function TripDateRangePicker({ startDate, endDate, onChange }: TripDateRangePickerProps) {
  const theme = useTheme();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const isInvalidRange = endDate < startDate;

  function handleValueChange(_event: DateTimePickerChangeEvent, selected: Date) {
    // Android's dialog closes itself on selection; iOS stays open until "Done".
    if (Platform.OS === 'android') setActivePicker(null);

    const iso = toISODateString(selected);
    if (activePicker === 'start') {
      onChange(iso, endDate < iso ? iso : endDate);
    } else if (activePicker === 'end') {
      onChange(startDate, iso);
    }
  }

  function renderBox(which: 'start' | 'end', label: string, value: string) {
    const active = activePicker === which;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${formatDisplayDate(value)}`}
        style={[
          styles.dateBox,
          {
            borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
            borderWidth: active ? 2 : 1.5,
            backgroundColor: theme.colors.surface,
          },
        ]}
        onPress={() => setActivePicker(which)}
      >
        <Icon source="calendar-blank-outline" size={20} color={theme.colors.primary} />
        <Text variant="bodyMedium" style={{ fontFamily: INTER_FAMILY.medium, color: theme.colors.onSurface }}>
          {formatDisplayDate(value)}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {renderBox('start', 'Start date', startDate)}
        {renderBox('end', 'End date', endDate)}
      </View>

      {isInvalidRange ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          End date must be on or after the start date.
        </Text>
      ) : null}

      {activePicker ? (
        <DateTimePicker
          value={parseISODate(activePicker === 'start' ? startDate : endDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={activePicker === 'end' ? parseISODate(startDate) : undefined}
          accentColor={theme.colors.primary}
          onValueChange={handleValueChange}
          onDismiss={() => setActivePicker(null)}
        />
      ) : null}

      {activePicker && Platform.OS === 'ios' ? (
        <AppButton variant="text" onPress={() => setActivePicker(null)}>
          Done
        </AppButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBox: {
    flex: 1,
    height: CONTROL_HEIGHT,
    borderRadius: RADII.inputs,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
