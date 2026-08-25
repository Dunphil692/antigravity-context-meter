import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSPanel!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        
        // 初始悬浮在屏幕右上角 (靠近桌面端聊天框位置)
        let initialWidth: CGFloat = 380
        let initialHeight: CGFloat = 360
        let initialX = screenRect.maxX - initialWidth - 24
        let initialY = screenRect.maxY - initialHeight - 48
        
        let frame = NSRect(x: initialX, y: initialY, width: initialWidth, height: initialHeight)

        // 创建无边框、半透明、全局置顶的悬浮小面板
        window = NSPanel(
            contentRect: frame,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        window.level = .floating // 全局置顶浮动
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.isMovableByWindowBackground = true // 按住背景自由拖拽
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary] // 跨桌面与全屏空间常驻

        // 配置透明 WebKit 视图
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: NSRect(origin: .zero, size: frame.size), configuration: config)
        webView.setValue(false, forKey: "drawsBackground") // 完全透明底色
        webView.autoresizingMask = [.width, .height]

        window.contentView?.addSubview(webView)

        // 加载本地 Capsule 界面
        if let url = URL(string: "http://127.0.0.1:8765/capsule") {
            let req = URLRequest(url: url)
            webView.load(req)
        }

        window.makeKeyAndOrderFront(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory) // 不占用 Dock 图标，以轻量辅助组件模式运行
app.run()
