#!/usr/bin/env bash
# APK Verification Script for Phryvos
# Verifies package name, version, and certificate fingerprint

set -euo pipefail

APK_PATH="${1:-public/download/Phryvos.apk}"
EXPECTED_PACKAGE="in.phryvos.app"
EXPECTED_FINGERPRINT="1A:6D:AF:71:40:7C:84:65:E0:BD:1C:3D:FB:0D:87:5B:FC:DB:93:29:09:03:33:AA:E0:C1:56:BF:EC:03:16:CD"

echo "🔍 Phryvos APK Verification"
echo "=========================="
echo "APK: $APK_PATH"
echo ""

# Check if APK exists
if [[ ! -f "$APK_PATH" ]]; then
    echo "❌ APK not found at $APK_PATH"
    exit 1
fi

# Check for required tools
for tool in aapt apksigner keytool openssl; do
    if ! command -v $tool &> /dev/null; then
        echo "⚠️  $tool not found in PATH"
    fi
done

echo "📦 Extracting APK info..."
echo ""

# Extract package name and version using aapt
if command -v aapt &> /dev/null; then
    echo "Using aapt..."
    AAPT_OUTPUT=$(aapt dump badging "$APK_PATH" 2>/dev/null)

    PACKAGE=$(echo "$AAPT_OUTPUT" | grep "package: name=" | sed -E "s/.*name='([^']+)'.*/\1/")
    VERSION_CODE=$(echo "$AAPT_OUTPUT" | grep "package: name=" | sed -E "s/.*versionCode='([^']+)'.*/\1/")
    VERSION_NAME=$(echo "$AAPT_OUTPUT" | grep "package: name=" | sed -E "s/.*versionName='([^']+)'.*/\1/")
    MIN_SDK=$(echo "$AAPT_OUTPUT" | grep "sdkVersion:" | sed -E "s/.*sdkVersion='([^']+)'.*/\1/")
    TARGET_SDK=$(echo "$AAPT_OUTPUT" | grep "targetSdkVersion:" | sed -E "s/.*targetSdkVersion='([^']+)'.*/\1/")

    echo "Package Name: $PACKAGE"
    echo "Version Code: $VERSION_CODE"
    echo "Version Name: $VERSION_NAME"
    echo "Min SDK: $MIN_SDK"
    echo "Target SDK: $TARGET_SDK"
    echo ""

    if [[ "$PACKAGE" == "$EXPECTED_PACKAGE" ]]; then
        echo "✅ Package name matches: $EXPECTED_PACKAGE"
    else
        echo "❌ Package name mismatch!"
        echo "   Expected: $EXPECTED_PACKAGE"
        echo "   Found:    $PACKAGE"
    fi
else
    echo "⚠️  aapt not available, skipping package info"
fi

# Verify APK signature
if command -v apksigner &> /dev/null; then
    echo "🔐 Verifying APK signature..."
    if apksigner verify --print-certs "$APK_PATH" 2>&1 | grep -q "Verifies"; then
        echo "✅ APK signature is valid"
    else
        echo "❌ APK signature verification failed"
    fi
    echo ""
fi

# Extract certificate fingerprint
echo "🔑 Extracting certificate fingerprint..."

# Method 1: Using openssl (works without Android SDK)
if command -v openssl &> /dev/null; then
    echo "Using openssl..."

    # Create temp directory
    TMPDIR=$(mktemp -d)
    trap "rm -rf $TMPDIR" EXIT

    # Extract RSA certificate
    unzip -q -o "$APK_PATH" "META-INF/*.RSA" -d "$TMPDIR" 2>/dev/null || true

    RSA_FILE=$(find "$TMPDIR" -name "*.RSA" | head -1)

    if [[ -n "$RSA_FILE" && -f "$RSA_FILE" ]]; then
        FINGERPRINT=$(openssl pkcs7 -inform DER -in "$RSA_FILE" -print_certs -outform PEM | openssl x509 -noout -fingerprint -sha256 | sed 's/.*=//')
        echo "SHA-256 Fingerprint: $FINGERPRINT"

        # Normalize for comparison (remove colons, lowercase)
        FINGERPRINT_NORM=$(echo "$FINGERPRINT" | tr -d ':' | tr '[:upper:]' '[:lower:]')
        EXPECTED_NORM=$(echo "$EXPECTED_FINGERPRINT" | tr -d ':' | tr '[:upper:]' '[:lower:]')

        if [[ "$FINGERPRINT_NORM" == "$EXPECTED_NORM" ]]; then
            echo "✅ Certificate fingerprint matches assetlinks.json"
        else
            echo "❌ Certificate fingerprint MISMATCH!"
            echo "   Expected: $EXPECTED_FINGERPRINT"
            echo "   Found:    $FINGERPRINT"
        fi
    else
        echo "⚠️  No RSA certificate found in APK"
    fi
fi

# Method 2: Using keytool (if keystore available)
if command -v keytool &> /dev/null && [[ -f "signing.keystore" ]]; then
    echo ""
    echo "Using keytool with keystore..."
    KEYSTORE_FINGERPRINT=$(keytool -list -v -keystore signing.keystore -storepass "${KEYSTORE_PASSWORD:-}" -alias "${KEY_ALIAS:-phryvos}" 2>/dev/null | grep "SHA256:" | head -1 | sed 's/.*SHA256: //')

    if [[ -n "$KEYSTORE_FINGERPRINT" ]]; then
        echo "Keystore SHA-256: $KEYSTORE_FINGERPRINT"
        KEYSTORE_NORM=$(echo "$KEYSTORE_FINGERPRINT" | tr -d ':' | tr '[:upper:]' '[:lower:]')

        if [[ "$KEYSTORE_NORM" == "$EXPECTED_NORM" ]]; then
            echo "✅ Keystore fingerprint matches"
        else
            echo "❌ Keystore fingerprint mismatch"
        fi
    fi
fi

# Verify assetlinks.json
echo ""
echo "🔗 Checking assetlinks.json..."
ASSETLINKS_PATH="public/.well-known/assetlinks.json"
if [[ -f "$ASSETLINKS_PATH" ]]; then
    ASSETLINKS_FINGERPRINT=$(cat "$ASSETLINKS_PATH" | grep -o '"sha256_cert_fingerprints":\s*\["[^"]*"\]' | sed 's/.*\["\([^"]*\)"\].*/\1/')
    echo "assetlinks.json fingerprint: $ASSETLINKS_FINGERPRINT"

    ASSETLINKS_NORM=$(echo "$ASSETLINKS_FINGERPRINT" | tr -d ':' | tr '[:upper:]' '[:lower:]')

    if [[ "$ASSETLINKS_NORM" == "$EXPECTED_NORM" ]]; then
        echo "✅ assetlinks.json fingerprint matches"
    else
        echo "❌ assetlinks.json fingerprint mismatch"
    fi

    # Check package name in assetlinks.json
    ASSETLINKS_PACKAGE=$(cat "$ASSETLINKS_PATH" | grep -o '"package_name":\s*"[^"]*"' | sed 's/.*"package_name":\s*"\([^"]*\)".*/\1/')
    echo "assetlinks.json package: $ASSETLINKS_PACKAGE"

    if [[ "$ASSETLINKS_PACKAGE" == "$EXPECTED_PACKAGE" ]]; then
        echo "✅ assetlinks.json package name matches"
    else
        echo "❌ assetlinks.json package name mismatch"
    fi
else
    echo "⚠️  assetlinks.json not found at $ASSETLINKS_PATH"
fi

# APK file checksum
echo ""
echo "📋 APK SHA-256 Checksum:"
APK_SHA256=$(sha256sum "$APK_PATH" | cut -d' ' -f1)
echo "   $APK_SHA256"

echo ""
echo "=========================="
echo "Verification complete"