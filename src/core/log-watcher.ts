import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ContextUsageSnapshot, ContextBreakdown, ConversationItem } from '../../types/context';
import { FastTokenizer } from './tokenizer';
import { ModelDetector } from './model-detector';
import { TopConsumersAnalyzer } from './top-consumers';
import { ContextSummarizer } from './summarizer';

/**
 * Antigravity 真实日志监听与解析引擎 (支持多会话智能选择与桌面/IDE双端识别)
 */
export class LogWatcher {
  private baseDirs: Array<{ path: string; source: 'ide' | 'desktop'; label: string }>;
  private selectedConversationId: string | null = null; // null 表示自动跟随最新
  private currentConversationId: string | null = null;
  private currentLogFilePath: string | null = null;
  private fsWatcher: fs.FSWatcher | null = null;
  private onUpdateCallback: ((snapshot: ContextUsageSnapshot) => void) | null = null;
  private isScanning = false;

  constructor() {
    const home = os.homedir();
    this.baseDirs = [
      {
        path: path.join(home, '.gemini', 'antigravity', 'brain'),
        source: 'desktop',
        label: '桌面端',
      },
      {
        path: path.join(home, '.gemini', 'antigravity-ide', 'brain'),
        source: 'ide',
        label: 'IDE端',
      },
    ];
  }

  /**
   * 设置锁定的会话 ID (或设为 null / 'auto' 恢复自动跟随)
   */
  public setSelectedConversation(convId: string | null) {
    this.selectedConversationId = convId === 'auto' ? null : convId;
    this.pollAndWatch(true);
  }

  /**
   * 列出本机近期所有可用会话（带标题、时间与所属端类型）
   */
  public listRecentConversations(limit: number = 15): ConversationItem[] {
    const items: ConversationItem[] = [];

    for (const base of this.baseDirs) {
      if (!fs.existsSync(base.path)) continue;

      try {
        const dirs = fs.readdirSync(base.path);
        for (const dir of dirs) {
          const fullPath = path.join(base.path, dir);
          try {
            const stat = fs.statSync(fullPath);
            if (!stat.isDirectory()) continue;

            const logPath = path.join(fullPath, '.system_generated', 'logs', 'transcript.jsonl');
            if (fs.existsSync(logPath)) {
              const logStat = fs.statSync(logPath);
              const title = this.extractTitleFromLog(logPath);

              items.push({
                id: dir,
                source: base.source,
                sourceLabel: base.label,
                title: title || `会话 ${dir.slice(0, 8)}`,
                lastModified: logStat.mtimeMs,
                lastUpdatedStr: new Date(logStat.mtimeMs).toLocaleTimeString(),
                logPath,
              });
            }
          } catch {}
        }
      } catch {}
    }

    // 按最新修改时间倒序排列
    items.sort((a, b) => b.lastModified - a.lastModified);
    return items.slice(0, limit);
  }

  /**
   * 从日志第一行提取会话标题 / 需求简要
   */
  private extractTitleFromLog(logPath: string): string {
    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'USER_INPUT') {
            let text = typeof entry.content === 'string' ? entry.content : '';
            if (text.includes('<USER_REQUEST>')) {
              text = text.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0];
            }
            const clean = text.replace(/<.*?>/g, '').replace(/#+\s*/g, '').trim();
            const firstLine = clean.split('\n')[0].trim();
            if (firstLine.length > 0) {
              return firstLine.slice(0, 36) + (firstLine.length > 36 ? '...' : '');
            }
          }
        } catch {}
      }
    } catch {}
    return '未命名会话';
  }

  /**
   * 探测当前应聚焦的目标会话
   */
  public findTargetConversation(): { id: string; logPath: string; dirPath: string; source: 'desktop' | 'ide' } | null {
    const list = this.listRecentConversations(20);
    if (list.length === 0) return null;

    if (this.selectedConversationId) {
      const match = list.find((c) => c.id === this.selectedConversationId);
      if (match) {
        return {
          id: match.id,
          logPath: match.logPath,
          dirPath: path.dirname(path.dirname(path.dirname(match.logPath))),
          source: match.source,
        };
      }
    }

    // 默认自动跟随最新活动的会话
    const latest = list[0];
    return {
      id: latest.id,
      logPath: latest.logPath,
      dirPath: path.dirname(path.dirname(path.dirname(latest.logPath))),
      source: latest.source,
    };
  }

  public findLatestConversation() {
    return this.findTargetConversation();
  }

  /**
   * 解析指定的 transcript.jsonl 并生成快照
   */
  public parseTranscriptFile(logPath: string, convId: string, source: 'desktop' | 'ide' = 'desktop'): ContextUsageSnapshot | null {
    if (!fs.existsSync(logPath)) return null;

    const startTime = Date.now();
    let content = '';
    try {
      content = fs.readFileSync(logPath, 'utf8');
    } catch {
      return null;
    }

    const lines = content.split('\n');
    let modelName = 'Gemini 3.7 Flash'; // 默认
    let turnCount = 0;
    let convTitle = '';

    let systemRulesTokens = 0;
    let skillsMcpTokens = 0;
    let messagesTokens = 0;
    let toolOutputsTokens = 0;
    let metadataTokens = 0;

    const rawEvents: Array<{
      id: string;
      stepIndex: number;
      type: 'tool_call' | 'tool_output' | 'user_input' | 'system_rules' | 'mcp_schema';
      name: string;
      rawContent: string;
      timestamp: string;
    }> = [];

    // 系统基础规则注入估算
    systemRulesTokens += 6200;

    const userObjectives: string[] = [];
    const modifiedFilesSet = new Set<string>();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        const stepIndex = entry.step_index ?? turnCount;
        const time = entry.created_at || new Date().toISOString();
        const type = entry.type;
        const contentStr = typeof entry.content === 'string' ? entry.content : '';

        // 1. 检查模型切换记录
        if (contentStr.includes('<USER_SETTINGS_CHANGE>')) {
          const match = contentStr.match(/Model Selection` from (?:None|.*?) to (.*?)\.(?:\s+No need|\n|$)/);
          if (match && match[1]) {
            modelName = match[1].trim();
          }
        }

        // 2. 分类统计各类数据
        if (type === 'USER_INPUT') {
          turnCount++;
          const t = FastTokenizer.countTokens(contentStr);
          messagesTokens += t;
          rawEvents.push({
            id: `user_${stepIndex}`,
            stepIndex,
            type: 'user_input',
            name: `用户提问 (轮次 #${turnCount})`,
            rawContent: contentStr,
            timestamp: time,
          });

          // 提取真实用户提问作为核心目标
          let cleanUserText = contentStr;
          if (cleanUserText.includes('<USER_REQUEST>')) {
            cleanUserText = cleanUserText.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0];
          }
          cleanUserText = cleanUserText.replace(/<.*?>/g, '').replace(/#+\s*/g, '').trim();

          if (cleanUserText) {
            const firstLine = cleanUserText.split('\n')[0].trim();
            if (!convTitle) convTitle = firstLine.slice(0, 36);
            if (firstLine && firstLine.length > 2 && !userObjectives.includes(firstLine)) {
              userObjectives.push(firstLine);
            }
          }
        } else if (type === 'PLANNER_RESPONSE') {
          const t = FastTokenizer.countTokens(contentStr);
          messagesTokens += t;

          if (Array.isArray(entry.tool_calls)) {
            for (const call of entry.tool_calls) {
              const callStr = JSON.stringify(call);
              const ct = FastTokenizer.countTokens(callStr);
              skillsMcpTokens += ct;

              if (call.args) {
                const target = call.args.TargetFile || call.args.AbsolutePath;
                if (typeof target === 'string' && target.length > 0) {
                  modifiedFilesSet.add(path.basename(target.replace(/"/g, '')));
                }
              }
            }
          }
        } else if (
          type === 'VIEW_FILE' ||
          type === 'RUN_COMMAND' ||
          type === 'LIST_DIRECTORY' ||
          type === 'GREP_SEARCH' ||
          type === 'TOOL_RESULT' ||
          type === 'GENERIC'
        ) {
          const t = FastTokenizer.countTokens(contentStr);
          toolOutputsTokens += t;
          rawEvents.push({
            id: `tool_${stepIndex}`,
            stepIndex,
            type: 'tool_output',
            name: `工具输出 (${type})`,
            rawContent: contentStr,
            timestamp: time,
          });
        } else if (type === 'CONVERSATION_HISTORY' || type === 'CHECKPOINT') {
          metadataTokens += FastTokenizer.countTokens(contentStr);
        }
      } catch {}
    }

    const totalUsed = systemRulesTokens + skillsMcpTokens + messagesTokens + toolOutputsTokens + metadataTokens;
    const spec = ModelDetector.detectSpec(modelName);
    const percentage = Math.min(100, Math.round((totalUsed / spec.maxTokens) * 1000) / 10);
    const healthLevel = ModelDetector.calculateHealth(percentage / 100, spec);

    const breakdown: ContextBreakdown = {
      systemRulesTokens,
      skillsMcpTokens,
      messagesTokens,
      toolOutputsTokens,
      metadataTokens,
    };

    const topConsumers = TopConsumersAnalyzer.extractTopConsumers(rawEvents, totalUsed, 5);
    const modifiedFiles = Array.from(modifiedFilesSet).slice(-8);
    const recentObjectives = userObjectives.slice(-3);

    const migrationPrompt = ContextSummarizer.generateMigrationPrompt({
      projectName: convTitle || '当前项目',
      modelName: spec.displayName,
      totalTokens: FastTokenizer.formatTokenCount(totalUsed),
      userObjectives: recentObjectives,
      modifiedFiles,
      recentDecisions: [
        `会话已交互 ${turnCount} 轮，累计占用 ${percentage}% 上下文空间`,
        `分布: System (${FastTokenizer.formatTokenCount(systemRulesTokens)}), MCP (${FastTokenizer.formatTokenCount(skillsMcpTokens)}), Messages (${FastTokenizer.formatTokenCount(messagesTokens)}), Tool Outputs (${FastTokenizer.formatTokenCount(toolOutputsTokens)})`,
      ],
    });

    const availableConversations = this.listRecentConversations(10);

    const snapshot: ContextUsageSnapshot = {
      conversationId: convId,
      conversationTitle: convTitle || `会话 ${convId.slice(0, 8)}`,
      source,
      lastUpdated: new Date().toLocaleTimeString(),
      modelName,
      modelDisplayName: spec.displayName,
      maxTokens: spec.maxTokens,
      usedTokens: totalUsed,
      percentage,
      healthLevel,
      breakdown,
      topConsumers,
      turnCount,
      isActive: true,
      recentObjectives,
      modifiedFiles,
      recentDecisions: [
        `会话交互已达 ${turnCount} 轮，占用 ${percentage}% 上下文空间`,
      ],
      migrationPrompt,
      availableConversations,
    };

    return snapshot;
  }

  /**
   * 启动实时监听
   */
  public start(callback: (snapshot: ContextUsageSnapshot) => void) {
    this.onUpdateCallback = callback;
    this.pollAndWatch();

    // 周期性（每 2 秒）检查是否有最新会话变动
    setInterval(() => {
      this.pollAndWatch();
    }, 2000);
  }

  private pollAndWatch(forceReload = false) {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      const target = this.findTargetConversation();
      if (!target) {
        this.isScanning = false;
        return;
      }

      if (target.id !== this.currentConversationId || forceReload || !this.fsWatcher) {
        if (this.fsWatcher) {
          this.fsWatcher.close();
          this.fsWatcher = null;
        }

        this.currentConversationId = target.id;
        this.currentLogFilePath = target.logPath;

        const snapshot = this.parseTranscriptFile(target.logPath, target.id, target.source);
        if (snapshot && this.onUpdateCallback) {
          this.onUpdateCallback(snapshot);
        }

        try {
          const logDir = path.dirname(target.logPath);
          this.fsWatcher = fs.watch(logDir, (eventType, filename) => {
            if (filename === 'transcript.jsonl' || filename === 'transcript.json') {
              const updated = this.parseTranscriptFile(target.logPath, target.id, target.source);
              if (updated && this.onUpdateCallback) {
                this.onUpdateCallback(updated);
              }
            }
          });
        } catch {}
      } else {
        if (this.currentLogFilePath) {
          const updated = this.parseTranscriptFile(this.currentLogFilePath, this.currentConversationId, target.source);
          if (updated && this.onUpdateCallback) {
            this.onUpdateCallback(updated);
          }
        }
      }
    } finally {
      this.isScanning = false;
    }
  }

  public stop() {
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }
  }
}
