// src/components/LocationSearchInput.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { List, Text, TextInput, useTheme } from 'react-native-paper';
import { createTravelPlannerService } from '../services/weather/factory';
import type { LocationResult } from '../services/weather/types';
import { INTER_FAMILY } from '../theme/fonts';
import { RADII } from '../theme/radii';
import { CONTROL_HEIGHT } from '../theme/spacing';
import { SectionLabel } from './SectionLabel';

const DEBOUNCE_MS = 350;

interface LocationSearchInputProps {
  initialQuery: string;
  onSelect: (location: LocationResult) => void;
}

export function LocationSearchInput({ initialQuery, onSelect }: LocationSearchInputProps) {
  const theme = useTheme();
  const service = useMemo(() => createTravelPlannerService(), []);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChangeText(text: string) {
    setQuery(text);
    setDropdownOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await service.searchLocations(text);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleSelect(location: LocationResult) {
    setQuery(location.name);
    setResults([]);
    setDropdownOpen(false);
    onSelect(location);
  }

  return (
    <View style={styles.container}>
      <SectionLabel>Destination</SectionLabel>
      <TextInput
        accessibilityLabel="Destination"
        placeholder="Where to?"
        value={query}
        onChangeText={handleChangeText}
        onFocus={() => setDropdownOpen(true)}
        mode="outlined"
        left={<TextInput.Icon icon="map-marker-outline" color={theme.colors.primary} />}
        right={loading ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> : undefined}
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        outlineStyle={styles.inputOutline}
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
        contentStyle={styles.inputContent}
      />
      {dropdownOpen && results.length > 0 ? (
        <View style={[styles.dropdown, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
          {results.map((location) => (
            <Pressable key={location.id} onPress={() => handleSelect(location)}>
              <List.Item
                title={location.name}
                description={location.country}
                left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
      {dropdownOpen && !loading && query.trim() && results.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyHint}>
          No matching locations — try a different spelling.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  input: {
    height: CONTROL_HEIGHT,
  },
  inputContent: {
    fontFamily: INTER_FAMILY.medium,
  },
  inputOutline: {
    borderRadius: RADII.inputs,
    borderWidth: 1.5,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: RADII.inputs,
    overflow: 'hidden',
  },
  emptyHint: {
    paddingHorizontal: 4,
  },
});
