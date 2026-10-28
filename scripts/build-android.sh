#!/usr/bin/env bash
set -euo pipefail

PROFILE="production"
APK=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --profile) PROFILE="$2"; shift 2 ;;
    --apk=yes) APK=true; shift ;;
    --apk=no)  APK=false; shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ "$APK" == true && "$PROFILE" == "production" ]]; then
  echo "Building Android APK (production-apk profile)"
  eas build --platform android --profile production-apk
elif [[ "$APK" == true ]]; then
  echo "Building Android APK — profile: $PROFILE"
  eas build --platform android --profile "$PROFILE"
else
  echo "Building Android AAB — profile: $PROFILE"
  eas build --platform android --profile "$PROFILE"
fi
