# Phryvos Signing Key Backup Procedure

**CRITICAL**: Losing the signing key means you cannot update the app on Google Play Store. Users would need to uninstall and reinstall. Follow this procedure exactly.

---

## Key Information

| Property | Value |
|----------|-------|
| **Keystore File** | `signing.keystore` |
| **Key Alias** | `phryvos` |
| **Key Password** | `tFsnxpEiIsTZ` |
| **Store Password** | `tFsnxpEiIsTZ` |
| **Key Algorithm** | RSA 2048-bit |
| **Validity** | ~55 years (until 2081) |
| **SHA-256 Fingerprint** | `1A:6D:AF:71:40:7C:84:65:E0:BD:1C:3D:FB:0D:87:5B:FC:DB:93:29:09:03:33:AA:E0:C1:56:BF:EC:03:16:CD` |
| **Subject** | `C=IN, O=Phryvos, OU=Core, CN=Phryvos Team` |

---

## Backup Locations (3-2-1 Rule)

### 1. Primary: Encrypted Password Manager (1Password / Bitwarden)
- Store the entire `signing.keystore` file as a document attachment
- Store passwords in secure notes
- Enable 2FA on the password manager account
- Share with trusted team members via vault sharing

### 2. Secondary: Encrypted USB Drive (Physical)
```
1. Encrypt USB drive with VeraCrypt (AES-256, strong passphrase)
2. Copy signing.keystore to encrypted volume
3. Create README.txt with key info (passwords, alias)
4. Store in fireproof safe / safety deposit box
5. Test restore annually
```

### 3. Tertiary: Shamir's Secret Sharing (Split among team)
```
# Split keystore password into 3 shares, require 2 to reconstruct
# Using: ssss-split (from ssss package)

echo "tFsnxpEiIsTZ" | ssss-split -t 2 -n 3 -w "keystore-password"
# Output: 3 shares, distribute to 3 trusted people

# To recover:
ssss-combine -t 2
# Enter any 2 shares
```

**Share Distribution:**
- Share 1: Lead Developer
- Share 2: CTO / Technical Lead  
- Share 3: Secure offline storage (printed QR code)

---

## Recovery Procedure

### Scenario A: Password Manager Available
1. Log into password manager
2. Download `signing.keystore` attachment
3. Retrieve passwords from secure note
4. Verify with `keytool -list -v -keystore signing.keystore`

### Scenario B: USB Drive Only
1. Insert USB drive
2. Mount VeraCrypt volume with passphrase
3. Copy `signing.keystore` to secure machine
4. Use passwords from README.txt

### Scenario C: Complete Loss (Shamir's Recovery)
1. Contact 2 of 3 share holders
2. Run `ssss-combine -t 2`
3. Enter shares when prompted
4. Recover keystore password
5. Use with keystore from any backup

---

## Verification Checklist (Run Quarterly)

- [ ] Keystore file accessible from password manager
- [ ] USB drive mounts and file readable
- [ ] At least 2 Shamir shares accessible
- [ ] `keytool -list` works with recovered credentials
- [ ] Fingerprint matches `1A:6D:AF:71:40:7C:84:65:E0:BD:1C:3D:FB:0D:87:5B:FC:DB:93:29:09:03:33:AA:E0:C1:56:BF:EC:03:16:CD`
- [ ] assetlinks.json on production matches fingerprint

```bash
# Quick verification
keytool -list -v -keystore signing.keystore -storepass tFsnxpEiIsTZ -alias phryvos | grep SHA256
```

---

## CI/CD Secrets Configuration

### GitHub Repository Secrets (Required)
```
ANDROID_KEYSTORE_BASE64    # base64 -i signing.keystore | tr -d '\n'
ANDROID_KEYSTORE_PASSWORD  # tFsnxpEiIsTZ
ANDROID_KEY_PASSWORD       # tFsnxpEiIsTZ
ANDROID_KEY_ALIAS          # phryvos
```

### To Generate Base64 Keystore:
```bash
base64 -i signing.keystore | tr -d '\n' | pbcopy  # macOS
base64 -w 0 signing.keystore | xclip -selection clipboard  # Linux
```

---

## Rotation Procedure (If Compromised)

**⚠️ WARNING**: Key rotation requires:
1. New keystore generation
2. New APK signed with new key
3. Update assetlinks.json with new fingerprint
4. Google Play Store: Contact support for key upgrade (complex process)
5. Users must uninstall old app, install new one

**Only rotate if absolutely necessary (key compromise).**

---

## Emergency Contacts

| Role | Contact | Access Level |
|------|---------|--------------|
| Lead Developer | [REDACTED] | Full |
| CTO | [REDACTED] | Full |
| Security Officer | [REDACTED] | Shamir Share Only |

---

## File Integrity

```bash
# Verify keystore hasn't been corrupted
sha256sum signing.keystore
# Expected: [compute and record on creation]
```

**Recorded SHA-256 of keystore file:** `________________________`

---

*Last Updated: 2026-10-03*
*Next Review: 2027-01-03*