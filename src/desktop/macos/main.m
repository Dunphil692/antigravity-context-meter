#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface CapsuleAppDelegate : NSObject <NSApplicationDelegate, WKScriptMessageHandler>
@property (strong, nonatomic) NSPanel *window;
@property (strong, nonatomic) WKWebView *webView;
@property (assign, nonatomic) BOOL isExpanded;
@end

@implementation CapsuleAppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    NSScreen *screen = [NSScreen mainScreen];
    NSRect screenRect = screen ? [screen visibleFrame] : NSMakeRect(0, 0, 1440, 900);

    // 默认常态小胶囊尺寸：紧凑型 210 x 48，绝不遮挡外部多余空间
    CGFloat width = 210;
    CGFloat height = 48;
    CGFloat x = screenRect.origin.x + screenRect.size.width - width - 20;
    CGFloat y = screenRect.origin.y + screenRect.size.height - height - 30;

    NSRect frame = NSMakeRect(x, y, width, height);
    self.isExpanded = NO;

    // 创建无边框浮动面板
    self.window = [[NSPanel alloc] initWithContentRect:frame
                                             styleMask:NSWindowStyleMaskBorderless | NSWindowStyleMaskNonactivatingPanel
                                               backing:NSBackingStoreBuffered
                                                 defer:NO];

    [self.window setHidesOnDeactivate:NO];
    [self.window setCanHide:NO];
    [self.window setLevel:NSFloatingWindowLevel];
    [self.window setOpaque:NO];
    [self.window setBackgroundColor:[NSColor clearColor]];
    [self.window setHasShadow:NO];
    [self.window setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces |
                                       NSWindowCollectionBehaviorFullScreenAuxiliary |
                                       NSWindowCollectionBehaviorStationary |
                                       NSWindowCollectionBehaviorIgnoresCycle];

    // 配置透明 WebKit 视图与通信通道
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

// 动态调整窗口尺寸（展开 370x410 vs 收起 210x48），锚定右上角位置不变
- (void)updateExpandedState:(BOOL)expanded {
    self.isExpanded = expanded;
    NSRect frame = self.window.frame;
    CGFloat topY = frame.origin.y + frame.size.height;
    CGFloat rightX = frame.origin.x + frame.size.width;

    CGFloat newWidth = expanded ? 370 : 210;
    CGFloat newHeight = expanded ? 410 : 48;

    NSRect newFrame = NSMakeRect(rightX - newWidth, topY - newHeight, newWidth, newHeight);
    [self.window setFrame:newFrame display:YES animate:NO];
}

// 原生 macOS 全局丝滑拖拽循环（彻底解决上下拉失灵问题）
- (void)handleGlobalDrag {
    NSWindow *win = self.window;
    NSPoint initialMouse = [NSEvent mouseLocation];
    NSRect initialFrame = win.frame;
    BOOL hasMoved = NO;

    while (YES) {
        NSEvent *event = [NSApp nextEventMatchingMask:(NSEventMaskLeftMouseUp | NSEventMaskLeftMouseDragged)
                                            untilDate:[NSDate distantFuture]
                                               inMode:NSEventTrackingRunLoopMode
                                              dequeue:YES];

        if (!event) continue;

        if (event.type == NSEventTypeLeftMouseDragged) {
            NSPoint currentMouse = [NSEvent mouseLocation];
            CGFloat deltaX = currentMouse.x - initialMouse.x;
            CGFloat deltaY = currentMouse.y - initialMouse.y;

            if (fabs(deltaX) > 2.0 || fabs(deltaY) > 2.0) {
                hasMoved = YES;
            }

            NSRect newFrame = initialFrame;
            newFrame.origin.x += deltaX;
            newFrame.origin.y += deltaY;
            [win setFrameOrigin:newFrame.origin];
        } else if (event.type == NSEventTypeLeftMouseUp) {
            // 如果没有发生有效拖拽位移，说明是单纯点击，触发展开/收起
            if (!hasMoved) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    [self.webView evaluateJavaScript:@"window.toggleExpandFromNative()" completionHandler:nil];
                });
            }
            break;
        }
    }
}

// 接收 JS 消息
- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.name isEqualToString:@"capsuleApp"]) {
        NSDictionary *body = (NSDictionary *)message.body;
        NSString *action = body[@"action"];

        if ([action isEqualToString:@"quit"]) {
            [NSApp terminate:nil];
        } else if ([action isEqualToString:@"startDrag"]) {
            [self handleGlobalDrag];
        } else if ([action isEqualToString:@"setExpanded"]) {
            BOOL expanded = [body[@"expanded"] boolValue];
            [self updateExpandedState:expanded];
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
