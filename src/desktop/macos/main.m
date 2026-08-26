#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface CapsuleAppDelegate : NSObject <NSApplicationDelegate, WKScriptMessageHandler>
@property (strong, nonatomic) NSPanel *window;
@property (strong, nonatomic) WKWebView *webView;
@property (assign, nonatomic) BOOL isExpanded;
@property (strong, nonatomic) id globalClickMonitor;
@end

@implementation CapsuleAppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    NSScreen *screen = [NSScreen mainScreen];
    NSRect screenRect = screen ? [screen visibleFrame] : NSMakeRect(0, 0, 1440, 900);

    // 默认常态小胶囊尺寸：精确实体尺寸 200 x 42，严禁占用屏幕任何多余像素
    CGFloat width = 200;
    CGFloat height = 42;
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

    // 配置透明 WebKit 视图
    WKUserContentController *userContent = [[WKUserContentController alloc] init];
    [userContent addScriptMessageHandler:self name:@"capsuleApp"];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.userContentController = userContent;

    self.webView = [[WKWebView alloc] initWithFrame:NSMakeRect(0, 0, width, height) configuration:config];
    [self.webView setValue:@NO forKey:@"drawsBackground"];
    [self.webView setAutoresizingMask:NSViewWidthSizable | NSViewHeightSizable];

    [self.window.contentView addSubview:self.webView];

    // 关键特性：全局点击监听器。当卡片展开时，只要用户在微信/浏览器等外部点击，卡片立刻自动收起并释放屏幕！
    __weak typeof(self) weakSelf = self;
    self.globalClickMonitor = [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskLeftMouseDown | NSEventMaskRightMouseDown
                                                                     handler:^(NSEvent *event) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (strongSelf && strongSelf.isExpanded) {
            NSPoint mouseLocation = [NSEvent mouseLocation];
            if (!NSPointInRect(mouseLocation, strongSelf.window.frame)) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    [strongSelf.webView evaluateJavaScript:@"if(window.collapseFromNative) window.collapseFromNative();" completionHandler:nil];
                    [strongSelf updateExpandedState:NO];
                });
            }
        }
    }];

    // 加载本地 Capsule 界面
    NSURL *url = [NSURL URLWithString:@"http://127.0.0.1:8765/capsule"];
    NSURLRequest *request = [NSURLRequest requestWithURL:url];
    [self.webView loadRequest:request];

    [self.window makeKeyAndOrderFront:nil];
    [self.window orderFrontRegardless];
}

// 动态调整窗口尺寸（展开 360x390 vs 收起 200x42），锚定右上角位置不变
- (void)updateExpandedState:(BOOL)expanded {
    self.isExpanded = expanded;
    NSRect frame = self.window.frame;
    CGFloat topY = frame.origin.y + frame.size.height;
    CGFloat rightX = frame.origin.x + frame.size.width;

    CGFloat newWidth = expanded ? 360 : 200;
    CGFloat newHeight = expanded ? 390 : 42;

    NSRect newFrame = NSMakeRect(rightX - newWidth, topY - newHeight, newWidth, newHeight);
    [self.window setFrame:newFrame display:YES animate:NO];
}

// 原生 macOS 全局丝滑拖拽循环
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
            // 如果没有发生拖拽位移，说明是单纯点击，触发展开/收起
            if (!hasMoved) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    [self.webView evaluateJavaScript:@"if(window.toggleExpandFromNative) window.toggleExpandFromNative();" completionHandler:nil];
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

- (void)dealloc {
    if (self.globalClickMonitor) {
        [NSEvent removeMonitor:self.globalClickMonitor];
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
