#!/usr/bin/env bash
# Update assetlinks.json with certificate fingerprint from keystore

set -euo pipefail

KEYSTORE_PATH="${1:-signing.keystore}"
KEYSTORE_PASSWORD="${2:-}"
KEY_ALIAS="${3:-phryvos}"
ASSETLINKS_PATH="${4:-public/.well-known/assetlinks.json}"
PACKAGE_NAME="${5:-in.phryvos.app}"

if [[ -z "$KEYSTORE_PASSWORD" ]]; then
    echo "Usage: $0 <keystore_path> <keystore_password> [key_alias] [assetlinks_path] [package_name]"
    echo "Example: $0 signing.keystore tFsnxpEiIsTZ phryvos public/.well-known/assetlinks.json in.phryvos.app"
    exit 1
fi

if [[ ! -f "$KEYSTORE_PATH" ]]; then
    echo "❌ Keystore not found at $KEYSTORE_PATH"
    exit 1
fi

echo "🔑 Extracting certificate fingerprint from keystore..."
echo "Keystore: $KEYSTORE_PATH"
echo "Alias: $KEY_ALIAS"
echo ""

# Extract SHA-256 fingerprint using keytool
FINGERPRINT=$(keytool -list -v -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" -alias "$KEY_ALIAS" 2>/dev/null | grep "SHA256:" | head -1 | sed 's/.*SHA256: //')

if [[ -z "$FINGERPRINT" ]]; then
    echo "❌ Failed to extract fingerprint from keystore"
    echo "Check keystore password and alias"
    exit 1
fi

echo "Extracted SHA-256: $FINGERPRINT"
echo ""

# Update assetlinks.json
echo "📝 Updating $ASSETLINKS_PATH..."
mkdir -p "$(dirname "$ASSETLINKS_PATH")"

cat > "$ASSETLINKS_PATH" <<EOF
[{
      "relation": ["delegate_permission/common_handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "$PACKAGE_NAME",
        "sha256_cert_fingerprints": ["$FINGERPRINT"]
      }
    }]
EOF

echo "✅ assetlinks.json updated"
echo ""
cat "$ASSETLINKS_PATH"

# Verify the file is valid JSON
if command -v jq &> /dev/null; then
    jq . "$ASSETLINKS_PATH" > /dev/null && echo "" && echo "✅ JSON is valid"
fi