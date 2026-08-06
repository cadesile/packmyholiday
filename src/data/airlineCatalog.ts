export interface AirlinePreset {
  id: string;
  name: string;
  underseatMaxCm: string;
  overheadMaxCm?: string;
  defaultCheckedWeightKg: number;
  defaultCabinWeightKg: number;
  allowsFreeOverhead: boolean;
}

export const AIRLINE_PRESETS: AirlinePreset[] = [
  {
    id: 'ryanair',
    name: 'Ryanair',
    underseatMaxCm: '40 x 30 x 20',
    overheadMaxCm: '55 x 40 x 20',
    defaultCheckedWeightKg: 20,
    defaultCabinWeightKg: 10,
    allowsFreeOverhead: false,
  },
  {
    id: 'easyjet',
    name: 'easyJet',
    underseatMaxCm: '45 x 36 x 20',
    overheadMaxCm: '56 x 45 x 25',
    defaultCheckedWeightKg: 23,
    defaultCabinWeightKg: 15,
    allowsFreeOverhead: false,
  },
  {
    id: 'ba',
    name: 'British Airways',
    underseatMaxCm: '40 x 30 x 15',
    overheadMaxCm: '56 x 45 x 25',
    defaultCheckedWeightKg: 23,
    defaultCabinWeightKg: 23,
    allowsFreeOverhead: true,
  },
  {
    id: 'jet2',
    name: 'Jet2',
    underseatMaxCm: '40 x 30 x 20',
    overheadMaxCm: '56 x 45 x 25',
    defaultCheckedWeightKg: 22,
    defaultCabinWeightKg: 10,
    allowsFreeOverhead: true,
  },
  {
    id: 'tui',
    name: 'TUI Airways',
    underseatMaxCm: '40 x 30 x 20',
    overheadMaxCm: '55 x 40 x 20',
    defaultCheckedWeightKg: 20,
    defaultCabinWeightKg: 10,
    allowsFreeOverhead: true,
  },
];

export function getAirlinePreset(id: string | undefined): AirlinePreset | undefined {
  return AIRLINE_PRESETS.find((preset) => preset.id === id);
}
