import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ContextUsageSnapshot } from '../../types/context';
import { ContextSummarizer } from '../core/summarizer';
import { FastTokenizer } from '../core/tokenizer';

/**
 * 1:1 Cursor 风格 Webview 面板控制器 (Stage 3)
 */
export class ContextWebviewManager {
  private panel: vscode.WebviewPanel | null = null;
  private latestSnapshot: ContextUsageSnapshot | null = null;
  private extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  public updateSnapshot(snapshot: ContextUsageSnapshot) {
    this.latestSnapshot = snapshot;
    if (this.panel) {
      this.panel.webview.postMessage({
        type: 'UPDATE_SNAPSHOT',
        payload: snapshot,
      });
    }
  }

  public show() {
    const column = vscode.ViewColumn.Beside;

    if (this.panel) {
      this.panel.reveal(column);
      if (this.latestSnapshot) {
        this.updateSnapshot(this.latestSnapshot);
      }
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'antigravityContextMeter',
      'Context Usage',
      { viewColumn: column, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'src', 'ui')],
      }
    );

    this.panel.webview.html = this.getHtmlContent(this.panel.webview);

    // 监听 Webview 内部消息
    this.panel.webview.onDidReceiveMessage((msg) => {
      if (msg.command === 'requestMigrationPrompt') {
        this.handleMigrationPrompt();
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = null;
    });

    // 初始渲染
    if (this.latestSnapshot) {
      setTimeout(() => {
        if (this.latestSnapshot) this.updateSnapshot(this.latestSnapshot);
      }, 100);
    }
  }

  private handleMigrationPrompt() {
    if (!this.latestSnapshot) return;

    const migrationPrompt =
      this.latestSnapshot.migrationPrompt ||
      ContextSummarizer.generateMigrationPrompt({
        projectName: vscode.workspace.name || '当前项目',
        modelName: this.latestSnapshot.modelDisplayName,
        totalTokens: FastTokenizer.formatTokenCount(this.latestSnapshot.usedTokens),
        userObjectives: this.latestSnapshot.recentObjectives || ['推进当前项目的核心任务'],
        modifiedFiles: this.latestSnapshot.modifiedFiles || [],
        recentDecisions: this.latestSnapshot.recentDecisions || ['通过 Antigravity Context Meter 迁移至新会话'],
      });

    if (this.panel) {
      this.panel.webview.postMessage({
        type: 'MIGRATION_PROMPT_READY',
        payload: migrationPrompt,
      });
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const uiDir = path.join(this.extensionUri.fsPath, 'src', 'ui');
    const htmlPath = path.join(uiDir, 'panel.html');
    const cssPath = path.join(uiDir, 'panel.css');
    const jsPath = path.join(uiDir, 'panel.js');

    let html = fs.readFileSync(htmlPath, 'utf8');
    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
    const jsUri = webview.asWebviewUri(vscode.Uri.file(jsPath));

    html = html.replace('href="panel.css"', `href="${cssUri}"`);
    html = html.replace('src="panel.js"', `src="${jsUri}"`);

    return html;
  }
}
