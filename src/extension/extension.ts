import * as vscode from 'vscode';
import { LogWatcher } from '../core/log-watcher';
import { ContextStatusBar } from './status-bar';
import { ContextWebviewManager } from './webview-panel';

let logWatcher: LogWatcher | null = null;
let statusBar: ContextStatusBar | null = null;
let webviewManager: ContextWebviewManager | null = null;

/**
 * 插件激活入口 (Stage 3)
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('[Antigravity Context Meter] 插件已成功激活');

  // 1. 初始化状态栏与 Webview 管理器
  statusBar = new ContextStatusBar();
  webviewManager = new ContextWebviewManager(context.extensionUri);

  context.subscriptions.push(statusBar);

  // 2. 注册打开面板的命令
  const openCmd = vscode.commands.registerCommand('antigravity-context-meter.openPanel', () => {
    if (webviewManager) {
      webviewManager.show();
    }
  });
  context.subscriptions.push(openCmd);

  // 3. 启动实时日志监听引擎
  logWatcher = new LogWatcher();
  logWatcher.start((snapshot) => {
    if (statusBar) {
      statusBar.update(snapshot);
    }
    if (webviewManager) {
      webviewManager.updateSnapshot(snapshot);
    }
  });
}

/**
 * 插件释放
 */
export function deactivate() {
  if (logWatcher) {
    logWatcher.stop();
    logWatcher = null;
  }
}
