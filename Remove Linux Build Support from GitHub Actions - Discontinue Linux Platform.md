# Remove Linux Build Support from GitHub Actions - Discontinue Linux Platform

## Primary Objective

**Remove Linux executable production from GitHub Actions** - We are discontinuing Linux support for the Node Builder.

## Current Problem

- GitHub Actions is still building Linux executables despite not supporting Linux
- Users encounter connection issues on Debian (yellow "reconnecting" bar)
- Offering Linux installation without proper support creates user frustration
- Wasting CI/CD resources on unsupported platform builds

## Immediate Action Required

**Remove Linux executable production from GitHub Actions workflow**

## GitHub Actions Changes (Priority 1)

- [ ] **Remove Linux build step from CI/CD pipeline**
- [ ] Update build matrix to exclude Linux targets
- [ ] Remove Linux-specific build scripts and configurations
- [ ] Clean up Linux build artifacts and release assets
- [ ] Update release process to exclude Linux executables

## Documentation Updates (Priority 2)

- [ ] Update installation guides to remove Linux references
- [ ] Update README with supported platforms (Windows/macOS only)
- [ ] Remove Linux installation instructions

## Success Criteria

- [ ] **Linux executables no longer built in GitHub Actions**
- [ ] No Linux downloads available in releases
- [ ] CI/CD pipeline optimized (faster builds, lower costs)
- [ ] No new Linux users can download unsupported builds

## Technical Details

The Debian connection issues (yellow "reconnecting" bar) are symptoms of incomplete Linux support. Rather than fixing these issues, we're removing Linux support entirely to:

- Focus resources on supported platforms
- Eliminate user confusion and support burden
- Streamline development and testing processes
- Reduce CI/CD complexity and costs

## Priority

**High** - This affects CI/CD efficiency and prevents user confusion about platform support.

## Related

- Featurebase submission: [Debian Setup](https://neuron.featurebase.app/p/debian-setup)
- GitHub Actions configuration
- Platform support documentation
