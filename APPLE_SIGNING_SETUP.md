# Apple Code Signing & Notarization Setup Guide

This guide provides **step-by-step instructions** for setting up automated macOS code signing and notarization for the Neuron Node Builder project.

## Prerequisites

### 1. Apple Developer Program Membership

- **Required**: Active Apple Developer Program subscription ($99/year)
- **Account Type**: Individual or Organization account
- **Access Level**: Admin access to Apple Developer account

### 2. Development Environment

- **macOS**: Required for initial certificate generation
- **Xcode**: Latest version with Command Line Tools
- **GitHub Account**: Admin access to repository

## Step 1: Generate Apple Developer Certificates

### 1.1 Create Developer ID Application Certificate

1. **Open Keychain Access** on your Mac
2. **Menu**: Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
3. **Fill out**:
   - User Email: Your Apple Developer account email
   - Common Name: Your name or company name
   - Request: Saved to disk
4. **Save** the Certificate Signing Request (.certSigningRequest file)

5. **Go to** [Apple Developer Portal](https://developer.apple.com/account/resources/certificates)
6. **Click** "+" to create new certificate
7. **Select** "Developer ID Application" (for distributing outside Mac App Store)
8. **Upload** your .certSigningRequest file
9. **Download** the generated certificate (.cer file)
10. **Double-click** the .cer file to install in Keychain Access

### 1.2 Export Certificate for GitHub Actions

1. **Open Keychain Access**
2. **Find** your "Developer ID Application" certificate
3. **Right-click** → Export "Developer ID Application: Your Name"
4. **Choose**:
   - File Format: Personal Information Exchange (.p12)
   - Location: Desktop
   - Password: Create a strong password (save this!)
5. **Save** the .p12 file

### 1.3 Convert Certificate to Base64

```bash
# Convert .p12 to base64 for GitHub Secrets
base64 -i /path/to/your/certificate.p12 | pbcopy
# This copies the base64 string to your clipboard
```

## Step 2: Create App Store Connect API Key

### 2.1 Generate API Key

1. **Go to** [App Store Connect](https://appstoreconnect.apple.com/access/api)
2. **Click** "+" to create new API key
3. **Fill out**:
   - Name: "GitHub Actions Notarization"
   - Access: Developer (minimum required)
4. **Download** the .p8 file (AuthKey_XXXXXXXXXX.p8)
5. **Note** the Key ID and Issuer ID from the page

### 2.2 Convert API Key to Base64

```bash
# Convert .p8 to base64 for GitHub Secrets
base64 -i /path/to/AuthKey_XXXXXXXXXX.p8 | pbcopy
# This copies the base64 string to your clipboard
```

## Step 3: Configure GitHub Secrets

Go to your repository: **Settings → Secrets and variables → Actions**

### 3.1 Required Secrets

Add these secrets with the **exact names**:

| Secret Name                  | Description                              | Example                                           |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `APPLE_CERTIFICATE_BASE64`   | Base64-encoded .p12 certificate          | `MIIM8wIBAzCCDL...`                               |
| `APPLE_CERTIFICATE_PASSWORD` | Password for .p12 certificate            | `YourStrongPassword123!`                          |
| `APPLE_SIGNING_IDENTITY`     | Exact certificate name from Keychain     | `Developer ID Application: John Doe (ABC123DEF4)` |
| `APPLE_TEAM_ID`              | Your Apple Developer Team ID             | `ABC123DEF4`                                      |
| `APPLE_API_KEY_ID`           | App Store Connect API Key ID             | `ABCD123456`                                      |
| `APPLE_API_ISSUER_ID`        | App Store Connect Issuer ID              | `12345678-1234-1234-1234-123456789012`            |
| `APPLE_API_KEY_BASE64`       | Base64-encoded .p8 API key               | `LS0tLS1CRUdJTi...`                               |
| `KEYCHAIN_PASSWORD`          | Random secure password for temp keychain | `SecureRandom123!@#`                              |

### 3.2 How to Find Your Values

#### APPLE_SIGNING_IDENTITY

```bash
# Run this in Terminal to find exact certificate name:
security find-identity -v -p codesigning
# Look for "Developer ID Application: Your Name (TEAMID)"
```

#### APPLE_TEAM_ID

- **Option 1**: Apple Developer Portal → Membership → Team ID
- **Option 2**: Extract from certificate name (text in parentheses)

#### APPLE_API_ISSUER_ID

- Found in App Store Connect → Users and Access → Keys → Issuer ID

## Step 4: Security Best Practices

### 4.1 Secret Management

- **Use unique passwords** for each certificate
- **Rotate certificates** annually before expiration
- **Limit API key permissions** to minimum required
- **Monitor secret usage** in GitHub Actions logs

### 4.2 Access Control

- **Restrict repository access** to authorized team members only
- **Use branch protection** rules for main/master branch
- **Require pull request reviews** for workflow changes
- **Enable audit logging** for security monitoring

### 4.3 Certificate Security

- **Store original certificates** in secure password manager
- **Backup certificates** to encrypted storage
- **Document certificate expiration dates**
- **Set calendar reminders** for renewal

## Step 5: Testing the Setup

### 5.1 Test Workflow Manually

1. **Go to** Actions tab in your repository
2. **Click** "Production Build, Sign & Release" workflow
3. **Click** "Run workflow"
4. **Enter** test version (e.g., "1.0.0-test")
5. **Select** "staging" environment
6. **Monitor** the workflow execution

### 5.2 Verify Signing

After successful run:

```bash
# Download the macOS app and verify signature
spctl --assess --verbose /path/to/downloaded/app
codesign --verify --verbose /path/to/downloaded/app

# Should show "accepted" status and valid signature
```

## Troubleshooting

### Common Issues

#### "Certificate not found in keychain"

- **Solution**: Verify `APPLE_SIGNING_IDENTITY` matches exactly
- **Check**: Run `security find-identity -v -p codesigning` locally

#### "Notarization failed - Invalid"

- **Solution**: Ensure app is properly signed before notarization
- **Check**: Verify entitlements.plist is included and valid

#### "API authentication failed"

- **Solution**: Verify all API credentials are correct
- **Check**: Test API key manually with `xcrun notarytool history`

#### "Build integrity check failed"

- **Solution**: Ensure no files are modified between jobs
- **Check**: Review build process for deterministic outputs

### Debug Commands

```bash
# Check certificate validity
security find-identity -v -p codesigning

# Verify app signature
codesign --verify --verbose /path/to/app

# Check notarization status
xcrun notarytool history --key /path/to/key.p8 --key-id KEYID --issuer ISSUERID

# Test API key
xcrun notarytool submit --help
```

## Support

### Apple Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [Notarization Requirements](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/resolving_common_notarization_issues)

### GitHub Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [macOS Runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)

### Community

- [Stack Overflow](https://stackoverflow.com/questions/tagged/macos+code-signing)
- [Apple Developer Forums](https://developer.apple.com/forums/tags/code-signing)
- [GitHub Community](https://github.community/t/code-signing/10398)
