// src/components/TripDateRangePicker.tsx
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { formatDisplayDate, parseISODate, toISODateString } from '../utils/tripDates';

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

  function handleChange(event: DateTimePickerEvent, selected: Date | undefined) {
    if (Platform.OS === 'android') {
      setActivePicker(null);
      if (event.type !== 'set' || !selected) return;
    }
    if (!selected) return;

    const iso = toISODateString(selected);
    if (activePicker === 'start') {
      onChange(iso, endDate < iso ? iso : endDate);
    } else if (activePicker === 'end') {
      onChange(startDate, iso);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable style={[styles.dateBox, { borderColor: theme.colors.outline }]} onPress={() => setActivePicker('start')}>
          <Text variant="labelMedium">Start date</Text>
          <Text variant="titleMedium">{formatDisplayDate(startDate)}</Text>
        </Pressable>
        <Pressable style={[styles.dateBox, { borderColor: theme.colors.outline }]} onPress={() => setActivePicker('end')}>
          <Text variant="labelMedium">End date</Text>
          <Text variant="titleMedium">{formatDisplayDate(endDate)}</Text>
        </Pressable>
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
          onChange={handleChange}
        />
      ) : null}

      {activePicker && Platform.OS === 'ios' ? (
        <Button mode="text" onPress={() => setActivePicker(null)}>
          Done
        </Button>
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 12,
    gap: 2,
  },
});
