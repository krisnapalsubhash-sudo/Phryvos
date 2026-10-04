#!/usr/bin/env bash
# Generate Checksums for Release Artifacts

set -euo pipefail

VERSION="${1:-}"
ARTIFACTS_DIR="${2:-android/app/build/outputs}"

if [[ -z "$VERSION" ]]; then
    echo "Usage: $0 <version> [artifacts_dir]"
    echo "Example: $0 v1.0.0 android/app/build/outputs"
    exit 1
fi

echo "📦 Generating checksums for version: $VERSION"
echo "Artifacts directory: $ARTIFACTS_DIR"
echo ""

OUTPUT_FILE="checksums_${VERSION}.txt"
> "$OUTPUT_FILE"  # Clear or create file

# Find and hash APK files
echo "🔍 Finding APK files..."
find "$ARTIFACTS_DIR" -name "*.apk" -type f | while read -r apk; do
    if [[ -f "$apk" ]]; then
        echo "  Hashing: $apk"
        sha256sum "$apk" >> "$OUTPUT_FILE"
    fi
done

# Find and hash AAB files
echo "🔍 Finding AAB files..."
find "$ARTIFACTS_DIR" -name "*.aab" -type f | while read -r aab; do
    if [[ -f "$aab" ]]; then
        echo "  Hashing: $aab"
        sha256sum "$aab" >> "$OUTPUT_FILE"
    fi
done

# Also hash any mapping files
echo "🔍 Finding mapping files..."
find "$ARTIFACTS_DIR" -name "*.txt" -o -name "*.map" -o -name "*.json" | grep -E "(mapping|proguard)" | while read -r map; do
    if [[ -f "$map" ]]; then
        echo "  Hashing: $map"
        sha256sum "$map" >> "$OUTPUT_FILE"
    fi
done

echo ""
echo "✅ Checksums written to $OUTPUT_FILE"
echo ""
cat "$OUTPUT_FILE"

# Also create a versioned copy in the root
cp "$OUTPUT_FILE" "/root/projects/phryvos/checksums_${VERSION}.txt" 2>/dev/null || true
echo ""
echo "📋 Copy saved to project root"