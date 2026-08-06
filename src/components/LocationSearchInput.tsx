// src/components/LocationSearchInput.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { List, Text, TextInput, useTheme } from 'react-native-paper';
import { createTravelPlannerService } from '../services/weather/factory';
import type { LocationResult } from '../services/weather/types';

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
      <TextInput
        label="Destination"
        value={query}
        onChangeText={handleChangeText}
        onFocus={() => setDropdownOpen(true)}
        mode="outlined"
        right={loading ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> : undefined}
      />
      {dropdownOpen && results.length > 0 ? (
        <View style={[styles.dropdown, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
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
    gap: 4,
  },
  dropdown: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyHint: {
    paddingHorizontal: 4,
  },
});
