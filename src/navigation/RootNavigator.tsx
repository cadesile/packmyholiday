import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { Step1LogisticsAirline } from '../screens/wizard/Step1LogisticsAirline';
import { Step2Travelers } from '../screens/wizard/Step2Travelers';
import { Step3ActivityMatrix } from '../screens/wizard/Step3ActivityMatrix';
import { Step4HealthHygiene } from '../screens/wizard/Step4HealthHygiene';
import { Step5BaggageReview } from '../screens/wizard/Step5BaggageReview';
import { OutputScreen } from '../screens/OutputScreen';
import { SavedTripsScreen } from '../screens/SavedTripsScreen';
import { useTripStore } from '../state/useTripStore';
import { JAKARTA_FAMILY } from '../theme/fonts';

type Screen = 'wizard' | 'output' | 'savedTrips';

const WIZARD_STEPS: Record<number, React.ComponentType> = {
  1: Step1LogisticsAirline,
  2: Step2Travelers,
  3: Step3ActivityMatrix,
  4: Step4HealthHygiene,
  5: Step5BaggageReview,
};

function AppTitle() {
  const theme = useTheme();
  return (
    <Text variant="titleLarge" style={{ fontFamily: JAKARTA_FAMILY.bold }}>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontFamily: JAKARTA_FAMILY.bold }}>
        pack
      </Text>
      <Text variant="titleLarge" style={{ color: theme.colors.primary, fontFamily: JAKARTA_FAMILY.bold }}>
        myholiday
      </Text>
    </Text>
  );
}

export function RootNavigator() {
  const theme = useTheme();
  const [screen, setScreen] = useState<Screen>('wizard');
  const wizardStep = useTripStore((s) => s.wizardStep);
  const currentPlan = useTripStore((s) => s.currentPlan);
  const resetWizard = useTripStore((s) => s.resetWizard);

  useEffect(() => {
    if (currentPlan && screen === 'wizard') {
      setScreen('output');
    }
  }, [currentPlan, screen]);

  const StepComponent = WIZARD_STEPS[wizardStep] ?? Step1LogisticsAirline;

  let body: React.ReactNode;
  if (screen === 'savedTrips') {
    body = (
      <SavedTripsScreen
        onOpenTrip={() => setScreen('output')}
        onBack={() => setScreen(currentPlan ? 'output' : 'wizard')}
      />
    );
  } else if (screen === 'output') {
    body = (
      <OutputScreen
        onDone={() => {
          resetWizard();
          setScreen('wizard');
        }}
      />
    );
  } else {
    body = <StepComponent />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated={false}>
        <Appbar.Content title={<AppTitle />} />
        <Appbar.Action icon="bookmark-multiple-outline" color={theme.colors.primary} onPress={() => setScreen('savedTrips')} />
      </Appbar.Header>
      <View style={styles.body}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
