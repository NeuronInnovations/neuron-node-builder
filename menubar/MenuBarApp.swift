import Cocoa
import AppKit

class MenuBarApp: NSObject {
    private var statusItem: NSStatusItem!
    private var serverProcess: Process?
    private var serverURL = "http://localhost:1880"
    private var isServerRunning = false
    
    override init() {
        super.init()
        setupMenuBar()
        startServer()
    }
    
    private func setupMenuBar() {
        // Create status item in menu bar
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        
        // Set icon using the Neuron favicon
        if let button = statusItem.button {
            // Try to load the Neuron favicon from the app bundle
            let bundle = Bundle.main
            let faviconPath = "\(bundle.bundlePath)/Contents/Resources/neuron-favicon.png"
            
            if let faviconImage = NSImage(contentsOfFile: faviconPath) {
                // Resize the image to fit the menu bar (typically 18x18 points)
                faviconImage.size = NSSize(width: 18, height: 18)
                button.image = faviconImage
                print("✅ Neuron favicon loaded for menu bar")
            } else {
                // Fallback to AppIcon.png if favicon not found
                let appIconPath = "\(bundle.bundlePath)/Contents/Resources/AppIcon.png"
                if let appIconImage = NSImage(contentsOfFile: appIconPath) {
                    appIconImage.size = NSSize(width: 18, height: 18)
                    button.image = appIconImage
                    print("⚠️ Using AppIcon.png as fallback")
                } else {
                    // Final fallback to system icon
                    button.image = NSImage(systemSymbolName: "brain.head.profile", accessibilityDescription: "Neuron Node Builder")
                    print("⚠️ Using system icon as final fallback")
                }
            }
        }
        
        // Create menu
        let menu = NSMenu()
        
        // App title
        let titleItem = NSMenuItem(title: "Neuron Node Builder", action: nil, keyEquivalent: "")
        titleItem.isEnabled = false
        menu.addItem(titleItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Open Node-RED
        let openItem = NSMenuItem(title: "Open Neuron Builder Editor", action: #selector(openNodeRed), keyEquivalent: "o")
        openItem.target = self
        menu.addItem(openItem)
        
        // Server status
        let statusMenuItem = NSMenuItem(title: "Server Status: Starting...", action: nil, keyEquivalent: "")
        statusMenuItem.tag = 100 // We'll update this item
        menu.addItem(statusMenuItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Restart server
        let restartItem = NSMenuItem(title: "Restart Server", action: #selector(restartServer), keyEquivalent: "r")
        restartItem.target = self
        menu.addItem(restartItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Quit
        let quitItem = NSMenuItem(title: "Quit Neuron Node Builder", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)
        
        statusItem.menu = menu
        
        // Start monitoring server status
        Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            self.checkServerStatus()
        }
    }
    
    @objc private func menuBarButtonClicked() {
        print("Menu bar button clicked!")
    }
    
    @objc private func openNodeRed() {
        if let url = URL(string: serverURL) {
            NSWorkspace.shared.open(url)
        }
    }
    
    
    @objc private func restartServer() {
        stopServer()
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.startServer()
        }
    }
    
    @objc private func quitApp() {
        print("🛑 Quitting Neuron Node Builder...")
        stopServer()
        
        // Wait for server to stop before terminating the app
        DispatchQueue.main.asyncAfter(deadline: .now() + 6.0) {
            print("✅ App terminating")
            NSApplication.shared.terminate(nil)
        }
    }
    
    private func startServer() {
        guard serverProcess == nil else { return }
        
        // Get the path to the neuron-node-builder executable
        let bundle = Bundle.main
        let bundlePath = bundle.bundlePath
        let executablePath = "\(bundlePath)/Contents/MacOS/neuron-node-builder"
        
        // Check if the executable exists
        guard FileManager.default.fileExists(atPath: executablePath) else {
            showAlert(title: "Error", message: "Could not find neuron-node-builder executable at: \(executablePath)")
            return
        }
        
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executablePath)
        process.arguments = [
            "/snapshot/neuron-green/packages/node_modules/node-red/red.js",
            "--settings", "/snapshot/neuron-green/neuron-settings.js"
        ]
        
        // Set working directory
        process.currentDirectoryURL = URL(fileURLWithPath: bundle.bundlePath)
        
        // Capture output for debugging
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        
        do {
            try process.run()
            serverProcess = process
            
            // Note: Loading page is now handled by the Node.js loading server
            // No need to open it from Swift to avoid duplicate tabs
            
            // Update status after a delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                self.checkServerStatus()
            }
            
        } catch {
            showAlert(title: "Error", message: "Failed to start server: \(error.localizedDescription)")
        }
    }
    
    private func stopServer() {
        guard let process = serverProcess else { return }
        
        print("🛑 Stopping Neuron Node Builder server...")
        
        // Try graceful termination first
        process.terminate()
        
        // Wait for graceful shutdown, then force kill if needed
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            if process.isRunning {
                print("⚡ Force killing server process...")
                process.terminate()
            }
        }
        
        // Wait a bit more and then clean up
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
            self.serverProcess = nil
            self.isServerRunning = false
            self.updateStatusItem()
            print("✅ Server stopped")
        }
    }
    
    private func checkServerStatus() {
        let url = URL(string: serverURL)!
        let task = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    self?.isServerRunning = true
                } else {
                    self?.isServerRunning = false
                }
                self?.updateStatusItem()
            }
        }
        task.resume()
    }
    
    private func updateStatusItem() {
        guard let menu = statusItem.menu else { return }
        
        // Find and update the status item
        if let statusMenuItem = menu.item(withTag: 100) {
            if isServerRunning {
                statusMenuItem.title = "Server Status: Running ✅"
            } else {
                statusMenuItem.title = "Server Status: Stopped ❌"
            }
        }
        
        // Update button icon based on status
        if let button = statusItem.button {
            if isServerRunning {
                // Use the Neuron logo when running
                let bundle = Bundle.main
                let logoPath = "\(bundle.bundlePath)/Contents/Resources/AppIcon.png"
                
                if let logoImage = NSImage(contentsOfFile: logoPath) {
                    logoImage.size = NSSize(width: 18, height: 18)
                    button.image = logoImage
                } else {
                    button.image = NSImage(systemSymbolName: "brain.head.profile", accessibilityDescription: "Neuron Node Builder - Running")
                }
            } else {
                button.image = NSImage(systemSymbolName: "exclamationmark.triangle", accessibilityDescription: "Neuron Node Builder - Error")
            }
        }
    }
    
    private func showAlert(title: String, message: String) {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    private var menuBarApp: MenuBarApp?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Hide the app from the dock
        NSApp.setActivationPolicy(.accessory)
        
        // Create the menu bar app
        menuBarApp = MenuBarApp()
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        // Cleanup if needed
    }
}

// Main entry point
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
