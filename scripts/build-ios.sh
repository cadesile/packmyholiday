#!/usr/bin/env bash
set -euo pipefail

PROFILE="production"
SIMULATOR=false
SUBMIT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --profile) PROFILE="$2"; shift 2 ;;
    --simulator=yes) SIMULATOR=true; shift ;;
    --simulator=no)  SIMULATOR=false; shift ;;
    --submit=yes) SUBMIT=true; shift ;;
    --submit=no)  SUBMIT=false; shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ "$SIMULATOR" == true && "$SUBMIT" == true ]]; then
  echo "A simulator build cannot be submitted to TestFlight."
  exit 1
fi

# The version App Store Connect shows to testers comes from app.json; the build
# number is managed remotely by EAS (appVersionSource: remote + autoIncrement).
APP_VERSION=$(node -p "require('./app.json').expo.version")

if [[ "$SIMULATOR" == true ]]; then
  echo "Building iOS simulator app (ios-simulator profile) — v$APP_VERSION"
  eas build --platform ios --profile ios-simulator
  exit 0
fi

echo "Building iOS archive — profile: $PROFILE, v$APP_VERSION"
eas build --platform ios --profile "$PROFILE"

if [[ "$SUBMIT" == true ]]; then
  # NOTE: --profile here names a *submit* profile in eas.json, not a build
  # profile. Only "production" exists, and it is the default, so omit it.
  echo "Submitting latest iOS build to App Store Connect / TestFlight"
  eas submit --platform ios --latest
else
  echo
  echo "Build done. To send it to TestFlight:"
  echo "  ./scripts/build-ios.sh --submit=yes   (build + submit in one go)"
  echo "  eas submit --platform ios --latest    (submit this build now)"
fi
