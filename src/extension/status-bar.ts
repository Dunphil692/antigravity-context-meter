import * as vscode from 'vscode';
import { ContextUsageSnapshot } from '../../types/context';
import { FastTokenizer } from '../core/tokenizer';

/**
 * VS Code / Antigravity IDE 状态栏小圆环组件 (Stage 3)
 */
export class ContextStatusBar {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    // 创建右下角对齐的状态栏项（优先级 100，紧贴右侧常用控件）
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'antigravity-context-meter.openPanel';
    this.statusBarItem.text = '$(circle-outline) 0.0%';
    this.statusBarItem.tooltip = 'Antigravity 上下文计量器 (点击查看详情)';
    this.statusBarItem.show();
  }

  /**
   * 异步轻量更新状态栏显示 (遵循宪法第二条)
   */
  public update(snapshot: ContextUsageSnapshot) {
    const formattedUsed = FastTokenizer.formatTokenCount(snapshot.usedTokens);
    const formattedMax = FastTokenizer.formatTokenCount(snapshot.maxTokens);

    // 动态根据健康级别设置图标与颜色
    let icon = '$(circle-filled)';
    let color: vscode.ThemeColor | string | undefined = undefined;

    if (snapshot.healthLevel === 'optimal') {
      color = '#10b981'; // 翠绿
    } else if (snapshot.healthLevel === 'moderate') {
      color = '#f59e0b'; // 琥珀黄
    } else if (snapshot.healthLevel === 'warning') {
      color = '#f97316'; // 警戒橙
      icon = '$(warning)';
    } else if (snapshot.healthLevel === 'critical') {
      color = '#ef4444'; // 呼吸红
      icon = '$(flame)';
    }

    this.statusBarItem.text = `${icon} ${snapshot.percentage.toFixed(1)}% (~${formattedUsed})`;
    this.statusBarItem.color = color;

    // 悬停 Markdown 富文本 Tooltip
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`### 🧠 Antigravity Context Meter\n\n`);
    md.appendMarkdown(`- **当前模型**：\`${snapshot.modelDisplayName}\`\n`);
    md.appendMarkdown(`- **上下文用量**：\`${formattedUsed} / ${formattedMax} Tokens\` (\`${snapshot.percentage}%\`)\n`);
    md.appendMarkdown(`- **健康度状态**：\`${snapshot.healthLevel.toUpperCase()}\`\n`);
    md.appendMarkdown(`- **当前轮次**：\`${snapshot.turnCount} 轮\`\n\n`);
    md.appendMarkdown(`---\n👉 **点击展开详细分段用量与 Top 消耗溯源面板**`);

    this.statusBarItem.tooltip = md;
  }

  public dispose() {
    this.statusBarItem.dispose();
  }
}
