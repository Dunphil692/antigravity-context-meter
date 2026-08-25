#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface CapsuleAppDelegate : NSObject <NSApplicationDelegate, WKScriptMessageHandler>
@property (strong, nonatomic) NSPanel *window;
@property (strong, nonatomic) WKWebView *webView;
@end

@implementation CapsuleAppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    NSScreen *screen = [NSScreen mainScreen];
    NSRect screenRect = screen ? [screen visibleFrame] : NSMakeRect(0, 0, 1440, 900);

    CGFloat width = 390;
    CGFloat height = 400;
    CGFloat x = screenRect.origin.x + screenRect.size.width - width - 20;
    CGFloat y = screenRect.origin.y + screenRect.size.height - height - 30;

    NSRect frame = NSMakeRect(x, y, width, height);

    // 创建无边框透明面板
    self.window = [[NSPanel alloc] initWithContentRect:frame
                                             styleMask:NSWindowStyleMaskBorderless | NSWindowStyleMaskNonactivatingPanel
                                               backing:NSBackingStoreBuffered
                                                 defer:NO];

    // 禁止失焦自动隐藏
    [self.window setHidesOnDeactivate:NO];
    [self.window setCanHide:NO];

    // 全局置顶与跨空间常驻
    [self.window setLevel:NSFloatingWindowLevel];
    [self.window setOpaque:NO];
    [self.window setBackgroundColor:[NSColor clearColor]];
    [self.window setHasShadow:NO];
    [self.window setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces |
                                       NSWindowCollectionBehaviorFullScreenAuxiliary |
                                       NSWindowCollectionBehaviorStationary |
                                       NSWindowCollectionBehaviorIgnoresCycle];

    // 配置透明 WebKit 视图与 JS 消息通道
    WKUserContentController *userContent = [[WKUserContentController alloc] init];
    [userContent addScriptMessageHandler:self name:@"capsuleApp"];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.userContentController = userContent;

    self.webView = [[WKWebView alloc] initWithFrame:NSMakeRect(0, 0, width, height) configuration:config];
    [self.webView setValue:@NO forKey:@"drawsBackground"];
    [self.webView setAutoresizingMask:NSViewWidthSizable | NSViewHeightSizable];

    [self.window.contentView addSubview:self.webView];

    // 加载本地 Capsule 界面
    NSURL *url = [NSURL URLWithString:@"http://127.0.0.1:8765/capsule"];
    NSURLRequest *request = [NSURLRequest requestWithURL:url];
    [self.webView loadRequest:request];

    [self.window makeKeyAndOrderFront:nil];
    [self.window orderFrontRegardless];
}

// 响应前端 JS 传递的退出与平滑拖拽移动指令
- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.name isEqualToString:@"capsuleApp"]) {
        NSDictionary *body = (NSDictionary *)message.body;
        NSString *action = body[@"action"];

        if ([action isEqualToString:@"quit"]) {
            [NSApp terminate:nil];
        } else if ([action isEqualToString:@"move"]) {
            // 实时更新窗口绝对坐标
            CGFloat dx = [body[@"dx"] doubleValue];
            CGFloat dy = [body[@"dy"] doubleValue]; // dy 已在 JS 中根据 macOS 坐标系校准
            NSPoint origin = self.window.frame.origin;
            origin.x += dx;
            origin.y += dy;
            [self.window setFrameOrigin:origin];
        }
    }
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return NO;
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        CapsuleAppDelegate *delegate = [[CapsuleAppDelegate alloc] init];
        app.delegate = delegate;
        [app setActivationPolicy:NSApplicationActivationPolicyAccessory];
        [app run];
    }
    return 0;
}
