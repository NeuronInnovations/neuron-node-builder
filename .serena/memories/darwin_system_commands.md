# Darwin (macOS) System Commands

## File System Operations

### Basic Navigation
```bash
# List files (long format with hidden files)
ls -la

# Change directory
cd /path/to/directory

# Print working directory
pwd

# Create directory
mkdir directory_name
mkdir -p path/to/nested/directory  # Create nested directories

# Remove files/directories
rm file.txt
rm -rf directory/  # Recursive removal (use with caution)

# Copy files
cp source.txt destination.txt
cp -r source_dir/ dest_dir/  # Recursive copy

# Move/rename files
mv old_name.txt new_name.txt
mv file.txt /new/location/
```

### File Search
```bash
# Find files by name
find . -name "*.js"
find . -type f -name "buyer.js"

# Find directories
find . -type d -name "node_modules"

# Find and execute command on results
find . -name "*.log" -delete

# Search file contents
grep -r "search_term" .
grep -i "case_insensitive" file.txt  # Case insensitive
grep -n "pattern" file.txt           # Show line numbers
```

### File Viewing
```bash
# View entire file
cat file.txt

# View first lines
head -n 20 file.txt

# View last lines
tail -n 20 file.txt
tail -f log_file.txt  # Follow file updates

# Page through file
less file.txt
# (use q to quit, / to search)
```

## Process Management

### Process Monitoring
```bash
# List all processes
ps aux

# Find specific processes
ps aux | grep node

# Interactive process viewer
top
# (use q to quit)

# Enhanced top alternative (if installed)
htop
```

### Port Management
```bash
# Find process using specific port
lsof -i :1880
lsof -i :3000

# Find all listening ports
lsof -i -P -n | grep LISTEN

# Kill process by port
lsof -ti:1880 | xargs kill
lsof -ti:1880 | xargs kill -9  # Force kill
```

### Process Control
```bash
# Kill process by PID
kill 12345
kill -9 12345  # Force kill (SIGKILL)
kill -15 12345 # Graceful shutdown (SIGTERM)

# Kill processes by name
pkill node
pkill -9 node  # Force kill all node processes

# Background/foreground
command &  # Run in background
fg         # Bring to foreground
bg         # Resume in background
Ctrl+Z     # Suspend current process
```

## Network Operations

### Network Diagnostics
```bash
# Check connectivity
ping google.com
ping -c 4 localhost  # Send 4 packets

# Trace route
traceroute google.com

# DNS lookup
nslookup example.com
dig example.com

# Show network interfaces
ifconfig
```

### HTTP Requests
```bash
# Download file
curl -O https://example.com/file.zip
curl -L https://example.com  # Follow redirects

# Test API endpoint
curl http://localhost:1880/api/endpoint
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' http://localhost:1880/api

# Download with wget (if installed)
wget https://example.com/file.zip
```

## macOS-Specific Commands

### Security & Code Signing
```bash
# List code signing identities
security find-identity -v -p codesigning

# Sign application
codesign --force --deep --sign "Developer ID Application: Name" --options runtime --entitlements entitlements.plist App.app

# Verify signature
codesign --verify --verbose App.app
spctl --assess --verbose App.app

# Notarization
xcrun notarytool submit app.zip --key AuthKey.p8 --key-id KEY_ID --issuer ISSUER_ID --wait

# Staple notarization ticket
xcrun stapler staple App.app

# Validate stapling
xcrun stapler validate App.app
```

### System Information
```bash
# macOS version
sw_vers

# Hardware info
system_profiler SPHardwareDataType

# Disk usage
df -h

# Directory size
du -sh directory/
du -h --max-depth=1  # Size of subdirectories
```

### Package Management (Homebrew)
```bash
# Install package
brew install package_name

# Update Homebrew
brew update

# Upgrade packages
brew upgrade

# Search for package
brew search keyword

# List installed packages
brew list

# Uninstall package
brew uninstall package_name
```

## Git Operations

### Basic Git
```bash
# Clone repository
git clone https://github.com/user/repo.git

# Check status
git status

# Stage changes
git add .
git add file.txt

# Commit
git commit -m "Commit message"

# Push
git push origin branch_name

# Pull
git pull origin branch_name

# View diff
git diff
git diff HEAD~1  # Compare with previous commit

# View log
git log --oneline
git log --graph --oneline --all
```

### Branch Management
```bash
# List branches
git branch
git branch -a  # Include remote branches

# Create branch
git branch feature/new-feature
git checkout -b feature/new-feature  # Create and switch

# Switch branches
git checkout branch_name

# Delete branch
git branch -d branch_name
git branch -D branch_name  # Force delete

# Merge branch
git merge feature/branch_name
```

## Environment & Shell

### Environment Variables
```bash
# View all environment variables
env
printenv

# View specific variable
echo $PATH
echo $NODE_ENV

# Set variable (temporary)
export VAR_NAME=value

# Set variable (permanent - add to ~/.zshrc or ~/.bash_profile)
echo 'export VAR_NAME=value' >> ~/.zshrc
source ~/.zshrc
```

### Shell Customization
```bash
# Edit shell config (zsh - default on modern macOS)
nano ~/.zshrc
vim ~/.zshrc

# Edit bash config (older macOS)
nano ~/.bash_profile

# Reload config
source ~/.zshrc
source ~/.bash_profile
```

## Useful Utilities

### Text Processing
```bash
# Word count
wc -l file.txt  # Count lines
wc -w file.txt  # Count words

# Sort lines
sort file.txt
sort -r file.txt  # Reverse order

# Remove duplicates
sort file.txt | uniq

# Column operations
cut -d',' -f1 file.csv  # Extract first column from CSV

# Stream editor
sed 's/old/new/g' file.txt  # Replace all occurrences
sed -i '' 's/old/new/g' file.txt  # Edit file in place (macOS requires '')
```

### Archive Operations
```bash
# Create tar archive
tar -czf archive.tar.gz directory/

# Extract tar archive
tar -xzf archive.tar.gz

# Create zip
zip -r archive.zip directory/

# Extract zip
unzip archive.zip
```

### Permissions
```bash
# Change file permissions
chmod 755 script.sh    # rwxr-xr-x
chmod +x script.sh     # Add execute permission
chmod -R 755 directory/ # Recursive

# Change owner
chown user:group file.txt
chown -R user:group directory/

# View permissions
ls -la
```

## Performance & Monitoring

### Disk Operations
```bash
# Disk usage by directory
du -sh *
du -h -d 1  # Depth 1

# Free disk space
df -h

# Find large files
find . -type f -size +100M

# Clear cache (careful!)
sudo purge
```

### Memory Usage
```bash
# View memory usage
top -l 1 | head -n 10

# Detailed memory info
vm_stat
```

Note: macOS uses `zsh` as the default shell (since macOS Catalina). Some commands may differ slightly from Linux. The BSD versions of tools (like `sed`, `grep`) have slightly different syntax than GNU versions.
