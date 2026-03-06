#!/bin/bash
create-dmg --volname "OpenPLC Editor v4" --volicon "./assets/icon.icns" --background "./assets/dmg_background.png" --window-pos 200 120 --window-size 771 395 --icon-size 160 --icon "OpenPLC Editor.app" 200 170 --app-drop-link 580 170 "OpenPLC_Editor_4.1.1.dmg" "./release/build/mac/OpenPLC Editor.app"
create-dmg --volname "OpenPLC Editor v4" --volicon "./assets/icon.icns" --background "./assets/dmg_background.png" --window-pos 200 120 --window-size 771 395 --icon-size 160 --icon "OpenPLC Editor.app" 200 170 --app-drop-link 580 170 "OpenPLC_Editor_4.1.1-ARM.dmg" "./release/build/mac-arm64/OpenPLC Editor.app"

# Script to create branded DMG files for macOS distribution
# Usage: ./create_dmg.sh [version]
# If version is not provided, it will be read from package.json

set -e

# Get version from argument or package.json
if [ -n "$1" ]; then
    VERSION="$1"
else
    VERSION=$(node -p "require('./package.json').version")
fi

echo "Creating DMG files for version $VERSION..."

# Check if create-dmg is installed
if ! command -v create-dmg &> /dev/null; then
    echo "Error: create-dmg is not installed."
    echo "Install it with: brew install create-dmg"
    exit 1
fi

DMG_CREATED=0

# Create Intel (x64) DMG