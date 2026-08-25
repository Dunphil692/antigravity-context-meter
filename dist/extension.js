"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// src/core/log-watcher.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var os = __toESM(require("os"));

// src/core/tokenizer.ts
var FastTokenizer = class {
  /**
   * 估算任意文本的 Token 数量
   * 采用中英文混合加权 + 代码符号精确加权算法（对齐 Gemini / BPE Tokenizer 精度）
   */
  static countTokens(text) {
    if (!text || typeof text !== "string")
      return 0;
    const len = text.length;
    if (len === 0)
      return 0;
    let cjkCount = 0;
    let asciiWords = 0;
    let codeSymbols = 0;
    let whitespaceCount = 0;
    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i);
      if (code >= 19968 && code <= 40959 || code >= 13312 && code <= 19903 || code >= 63744 && code <= 64255) {
        cjkCount++;
      } else if (code <= 32) {
        whitespaceCount++;
      } else if (code >= 48 && code <= 57 || // 数字 0-9
      code >= 65 && code <= 90 || // 大写 A-Z
      code >= 97 && code <= 122 || // 小写 a-z
      code === 95) {
        asciiWords++;
      } else {
        codeSymbols++;
      }
    }
    const estimated = cjkCount * 1.35 + asciiWords * 0.28 + codeSymbols * 0.65 + whitespaceCount * 0.2;
    return Math.max(1, Math.round(estimated));
  }
  /**
   * 格式化 Token 数字为人类可读格式 (e.g. 28.8K, 1.2M, 950)
   */
  static formatTokenCount(tokens) {
    if (tokens >= 1e6) {
      return (tokens / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (tokens >= 1e3) {
      return (tokens / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return tokens.toString();
  }
};

// types/context.ts
var BUILTIN_MODEL_SPECS = [
  {
    namePattern: /gemini.*flash/i,
    displayName: "Gemini Flash (1M)",
    maxTokens: 1048576,
    warningThreshold: 0.75,
    criticalThreshold: 0.85
  },
  {
    namePattern: /gemini.*pro/i,
    displayName: "Gemini Pro (2M)",
    maxTokens: 2097152,
    warningThreshold: 0.75,
    criticalThreshold: 0.85
  },
  {
    namePattern: /claude/i,
    displayName: "Claude 3.5/3.7 (200K)",
    maxTokens: 2e5,
    warningThreshold: 0.75,
    criticalThreshold: 0.85
  },
  {
    namePattern: /gpt-4o|o1|o3/i,
    displayName: "OpenAI GPT-4o (128K)",
    maxTokens: 128e3,
    warningThreshold: 0.75,
    criticalThreshold: 0.85
  },
  {
    namePattern: /deepseek/i,
    displayName: "DeepSeek V3/R1 (128K)",
    maxTokens: 128e3,
    warningThreshold: 0.75,
    criticalThreshold: 0.85
  }
];
var DEFAULT_MODEL_SPEC = {
  namePattern: /.*/,
  displayName: "Standard Model (128K)",
  maxTokens: 128e3,
  warningThreshold: 0.75,
  criticalThreshold: 0.85
};

// src/core/model-detector.ts
var ModelDetector = class {
  /**
   * 根据模型名称字符串匹配对应的规格
   */
  static detectSpec(modelName) {
    if (!modelName || typeof modelName !== "string") {
      return DEFAULT_MODEL_SPEC;
    }
    const cleanedName = modelName.trim();
    for (const spec of BUILTIN_MODEL_SPECS) {
      if (spec.namePattern.test(cleanedName)) {
        return spec;
      }
    }
    return {
      ...DEFAULT_MODEL_SPEC,
      displayName: cleanedName
    };
  }
  /**
   * 计算健康度级别 (Optimal / Moderate / Warning / Critical)
   */
  static calculateHealth(percentage, spec) {
    if (percentage >= spec.criticalThreshold) {
      return "critical";
    }
    if (percentage >= spec.warningThreshold) {
      return "warning";
    }
    if (percentage >= 0.5) {
      return "moderate";
    }
    return "optimal";
  }
};

// src/core/top-consumers.ts
var TopConsumersAnalyzer = class {
  /**
   * 从提取的事件列表中筛选并计算出占用最多的前 N 项操作
   */
  static extractTopConsumers(rawEvents, totalTokens, limit = 5) {
    const scoredList = [];
    for (const ev of rawEvents) {
      const tokens = FastTokenizer.countTokens(ev.rawContent);
      if (tokens < 30)
        continue;
      const percentage = totalTokens > 0 ? tokens / totalTokens * 100 : 0;
      let displayName = ev.name;
      let details = "";
      if (ev.type === "tool_output") {
        if (ev.name.includes("view_file")) {
          displayName = `\u{1F4C4} \u67E5\u770B\u6587\u4EF6\u5185\u5BB9 (${ev.name.split(":")[1]?.trim() || "file"})`;
        } else if (ev.name.includes("run_command")) {
          displayName = `\u{1F5A5}\uFE0F \u7EC8\u7AEF\u6267\u884C\u8F93\u51FA (${ev.name.split(":")[1]?.trim() || "command"})`;
        } else if (ev.name.includes("grep_search") || ev.name.includes("list_dir")) {
          displayName = `\u{1F50D} \u4EE3\u7801\u68C0\u7D22\u7ED3\u679C (${ev.name})`;
        } else {
          displayName = `\u2699\uFE0F \u5DE5\u5177\u8F93\u51FA: ${ev.name}`;
        }
        details = ev.rawContent.slice(0, 150).replace(/\s+/g, " ");
      } else if (ev.type === "system_rules") {
        displayName = `\u{1F3DB}\uFE0F \u5168\u5C40\u7CFB\u7EDF\u89C4\u5219\u4E0E\u6280\u80FD\u6307\u4EE4 (${ev.name})`;
        details = "\u7CFB\u7EDF\u7EA7 Prompt\u3001GEMINI.md \u4E0E\u5185\u7F6E Agent \u6307\u4EE4";
      } else if (ev.type === "mcp_schema") {
        displayName = `\u{1F50C} MCP \u670D\u52A1\u5DE5\u5177 Schema (${ev.name})`;
        details = "\u6CE8\u518C\u7684\u5916\u90E8 MCP \u534F\u8BAE\u5DE5\u5177\u5B9A\u4E49";
      } else if (ev.type === "user_input") {
        displayName = `\u{1F4AC} \u7528\u6237\u8F93\u5165\u6D88\u606F (Step #${ev.stepIndex})`;
        details = ev.rawContent.slice(0, 150).replace(/\s+/g, " ");
      }
      scoredList.push({
        id: ev.id,
        stepIndex: ev.stepIndex,
        type: ev.type,
        name: displayName,
        details,
        tokens,
        percentage: Math.round(percentage * 10) / 10,
        timestamp: ev.timestamp
      });
    }
    scoredList.sort((a, b) => b.tokens - a.tokens);
    return scoredList.slice(0, limit);
  }
};

// src/core/summarizer.ts
var ContextSummarizer = class {
  /**
   * 基于会话中的关键信息提炼结构化迁移 Prompt
   */
  static generateMigrationPrompt(params) {
    const { projectName, modelName, totalTokens, userObjectives, modifiedFiles, recentDecisions } = params;
    const prompt = `# \u9879\u76EE\u65E0\u7F1D\u63A5\u7EED\u4E0A\u4E0B\u6587 (Context Migration Prompt)

> \u672C\u6458\u8981\u7531 **Antigravity Context Meter** \u81EA\u52A8\u63D0\u70BC\u3002
> **\u524D\u7F6E\u4F1A\u8BDD\u7528\u91CF**\uFF1A~${totalTokens} Tokens | **\u57FA\u51C6\u6A21\u578B**\uFF1A${modelName}

---

## \u{1F3AF} \u6838\u5FC3\u76EE\u6807\u4E0E\u9700\u6C42\u80CC\u666F
${userObjectives.length > 0 ? userObjectives.map((obj, i) => `${i + 1}. ${obj}`).join("\n") : "1. \u7EE7\u7EED\u63A8\u8FDB\u5F53\u524D\u9879\u76EE\u7684\u6838\u5FC3\u529F\u80FD\u4E0E\u67B6\u6784\u5B9E\u65BD\u3002"}

## \u{1F4DD} \u5DF2\u786E\u8BA4\u7684\u5173\u952E\u6280\u672F\u51B3\u7B56\u4E0E\u8BBE\u8BA1
${recentDecisions.length > 0 ? recentDecisions.map((dec, i) => `- ${dec}`).join("\n") : "- \u5DF2\u5EFA\u7ACB\u9879\u76EE\u6838\u5FC3\u5BAA\u6CD5\u4E0E\u5206\u9636\u6BB5\u5F00\u53D1\u89C4\u5212\u3002\n- \u5DF2\u786E\u7ACB\u6838\u5FC3\u67B6\u6784\u4E0E\u63A5\u53E3\u5951\u7EA6\u89C4\u8303\u3002"}

## \u{1F4C1} \u6D89\u53CA\u7684\u6838\u5FC3\u6587\u4EF6\u4E0E\u4EE3\u7801\u8D44\u4EA7
${modifiedFiles.length > 0 ? modifiedFiles.map((f) => `- \`${f}\``).join("\n") : "- \u6682\u65E0\u6216\u76F4\u63A5\u57FA\u4E8E\u5F53\u524D\u5DE5\u4F5C\u533A\u6587\u4EF6\u7EE7\u7EED\u3002"}

## \u{1F680} \u63A5\u4E0B\u6765\u8981\u505A\u7684\u4E8B\u60C5
\u8BF7\u8BFB\u53D6\u4EE5\u4E0A\u80CC\u666F\u4E0E\u5F53\u524D\u5DE5\u4F5C\u533A\uFF0C\u65E0\u9700\u91CD\u65B0\u89E3\u91CA\u67B6\u6784\uFF0C\u76F4\u63A5\u65E0\u7F1D\u7EE7\u7EED\u63A8\u8FDB\u4E0B\u4E00\u6B65\u5177\u4F53\u4EFB\u52A1\uFF01
`;
    return prompt;
  }
};

// src/core/log-watcher.ts
var LogWatcher = class {
  baseDirs;
  selectedConversationId = null;
  // null 表示自动跟随最新
  currentConversationId = null;
  currentLogFilePath = null;
  fsWatcher = null;
  onUpdateCallback = null;
  isScanning = false;
  constructor() {
    const home = os.homedir();
    this.baseDirs = [
      {
        path: path.join(home, ".gemini", "antigravity", "brain"),
        source: "desktop",
        label: "\u684C\u9762\u7AEF"
      },
      {
        path: path.join(home, ".gemini", "antigravity-ide", "brain"),
        source: "ide",
        label: "IDE\u7AEF"
      }
    ];
  }
  /**
   * 设置锁定的会话 ID (或设为 null / 'auto' 恢复自动跟随)
   */
  setSelectedConversation(convId) {
    this.selectedConversationId = convId === "auto" ? null : convId;
    this.pollAndWatch(true);
  }
  /**
   * 列出本机近期所有可用会话（带标题、时间与所属端类型）
   */
  listRecentConversations(limit = 15) {
    const items = [];
    for (const base of this.baseDirs) {
      if (!fs.existsSync(base.path))
        continue;
      try {
        const dirs = fs.readdirSync(base.path);
        for (const dir of dirs) {
          const fullPath = path.join(base.path, dir);
          try {
            const stat = fs.statSync(fullPath);
            if (!stat.isDirectory())
              continue;
            const logPath = path.join(fullPath, ".system_generated", "logs", "transcript.jsonl");
            if (fs.existsSync(logPath)) {
              const logStat = fs.statSync(logPath);
              const title = this.extractTitleFromLog(logPath);
              items.push({
                id: dir,
                source: base.source,
                sourceLabel: base.label,
                title: title || `\u4F1A\u8BDD ${dir.slice(0, 8)}`,
                lastModified: logStat.mtimeMs,
                lastUpdatedStr: new Date(logStat.mtimeMs).toLocaleTimeString(),
                logPath
              });
            }
          } catch {
          }
        }
      } catch {
      }
    }
    items.sort((a, b) => b.lastModified - a.lastModified);
    return items.slice(0, limit);
  }
  /**
   * 从日志第一行提取会话标题 / 需求简要
   */
  extractTitleFromLog(logPath) {
    try {
      const content = fs.readFileSync(logPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.trim())
          continue;
        try {
          const entry = JSON.parse(line);
          if (entry.type === "USER_INPUT") {
            let text = typeof entry.content === "string" ? entry.content : "";
            if (text.includes("<USER_REQUEST>")) {
              text = text.split("<USER_REQUEST>")[1].split("</USER_REQUEST>")[0];
            }
            const clean = text.replace(/<.*?>/g, "").replace(/#+\s*/g, "").trim();
            const firstLine = clean.split("\n")[0].trim();
            if (firstLine.length > 0) {
              return firstLine.slice(0, 36) + (firstLine.length > 36 ? "..." : "");
            }
          }
        } catch {
        }
      }
    } catch {
    }
    return "\u672A\u547D\u540D\u4F1A\u8BDD";
  }
  /**
   * 探测当前应聚焦的目标会话
   */
  findTargetConversation() {
    const list = this.listRecentConversations(20);
    if (list.length === 0)
      return null;
    if (this.selectedConversationId) {
      const match = list.find((c) => c.id === this.selectedConversationId);
      if (match) {
        return {
          id: match.id,
          logPath: match.logPath,
          dirPath: path.dirname(path.dirname(path.dirname(match.logPath))),
          source: match.source
        };
      }
    }
    const latest = list[0];
    return {
      id: latest.id,
      logPath: latest.logPath,
      dirPath: path.dirname(path.dirname(path.dirname(latest.logPath))),
      source: latest.source
    };
  }
  findLatestConversation() {
    return this.findTargetConversation();
  }
  /**
   * 解析指定的 transcript.jsonl 并生成快照
   */
  parseTranscriptFile(logPath, convId, source = "desktop") {
    if (!fs.existsSync(logPath))
      return null;
    const startTime = Date.now();
    let content = "";
    try {
      content = fs.readFileSync(logPath, "utf8");
    } catch {
      return null;
    }
    const lines = content.split("\n");
    let modelName = "Gemini 3.7 Flash";
    let turnCount = 0;
    let convTitle = "";
    let systemRulesTokens = 0;
    let skillsMcpTokens = 0;
    let messagesTokens = 0;
    let toolOutputsTokens = 0;
    let metadataTokens = 0;
    const rawEvents = [];
    systemRulesTokens += 6200;
    const userObjectives = [];
    const modifiedFilesSet = /* @__PURE__ */ new Set();
    for (const line of lines) {
      if (!line.trim())
        continue;
      try {
        const entry = JSON.parse(line);
        const stepIndex = entry.step_index ?? turnCount;
        const time = entry.created_at || (/* @__PURE__ */ new Date()).toISOString();
        const type = entry.type;
        const contentStr = typeof entry.content === "string" ? entry.content : "";
        if (contentStr.includes("<USER_SETTINGS_CHANGE>")) {
          const match = contentStr.match(/Model Selection` from (?:None|.*?) to (.*?)\.(?:\s+No need|\n|$)/);
          if (match && match[1]) {
            modelName = match[1].trim();
          }
        }
        if (type === "USER_INPUT") {
          turnCount++;
          const t = FastTokenizer.countTokens(contentStr);
          messagesTokens += t;
          rawEvents.push({
            id: `user_${stepIndex}`,
            stepIndex,
            type: "user_input",
            name: `\u7528\u6237\u63D0\u95EE (\u8F6E\u6B21 #${turnCount})`,
            rawContent: contentStr,
            timestamp: time
          });
          let cleanUserText = contentStr;
          if (cleanUserText.includes("<USER_REQUEST>")) {
            cleanUserText = cleanUserText.split("<USER_REQUEST>")[1].split("</USER_REQUEST>")[0];
          }
          cleanUserText = cleanUserText.replace(/<.*?>/g, "").replace(/#+\s*/g, "").trim();
          if (cleanUserText) {
            const firstLine = cleanUserText.split("\n")[0].trim();
            if (!convTitle)
              convTitle = firstLine.slice(0, 36);
            if (firstLine && firstLine.length > 2 && !userObjectives.includes(firstLine)) {
              userObjectives.push(firstLine);
            }
          }
        } else if (type === "PLANNER_RESPONSE") {
          const t = FastTokenizer.countTokens(contentStr);
          messagesTokens += t;
          if (Array.isArray(entry.tool_calls)) {
            for (const call of entry.tool_calls) {
              const callStr = JSON.stringify(call);
              const ct = FastTokenizer.countTokens(callStr);
              skillsMcpTokens += ct;
              if (call.args) {
                const target = call.args.TargetFile || call.args.AbsolutePath;
                if (typeof target === "string" && target.length > 0) {
                  modifiedFilesSet.add(path.basename(target.replace(/"/g, "")));
                }
              }
            }
          }
        } else if (type === "VIEW_FILE" || type === "RUN_COMMAND" || type === "LIST_DIRECTORY" || type === "GREP_SEARCH" || type === "TOOL_RESULT" || type === "GENERIC") {
          const t = FastTokenizer.countTokens(contentStr);
          toolOutputsTokens += t;
          rawEvents.push({
            id: `tool_${stepIndex}`,
            stepIndex,
            type: "tool_output",
            name: `\u5DE5\u5177\u8F93\u51FA (${type})`,
            rawContent: contentStr,
            timestamp: time
          });
        } else if (type === "CONVERSATION_HISTORY" || type === "CHECKPOINT") {
          metadataTokens += FastTokenizer.countTokens(contentStr);
        }
      } catch {
      }
    }
    const totalUsed = systemRulesTokens + skillsMcpTokens + messagesTokens + toolOutputsTokens + metadataTokens;
    const spec = ModelDetector.detectSpec(modelName);
    const percentage = Math.min(100, Math.round(totalUsed / spec.maxTokens * 1e3) / 10);
    const healthLevel = ModelDetector.calculateHealth(percentage / 100, spec);
    const breakdown = {
      systemRulesTokens,
      skillsMcpTokens,
      messagesTokens,
      toolOutputsTokens,
      metadataTokens
    };
    const topConsumers = TopConsumersAnalyzer.extractTopConsumers(rawEvents, totalUsed, 5);
    const modifiedFiles = Array.from(modifiedFilesSet).slice(-8);
    const recentObjectives = userObjectives.slice(-3);
    const migrationPrompt = ContextSummarizer.generateMigrationPrompt({
      projectName: convTitle || "\u5F53\u524D\u9879\u76EE",
      modelName: spec.displayName,
      totalTokens: FastTokenizer.formatTokenCount(totalUsed),
      userObjectives: recentObjectives,
      modifiedFiles,
      recentDecisions: [
        `\u4F1A\u8BDD\u5DF2\u4EA4\u4E92 ${turnCount} \u8F6E\uFF0C\u7D2F\u8BA1\u5360\u7528 ${percentage}% \u4E0A\u4E0B\u6587\u7A7A\u95F4`,
        `\u5206\u5E03: System (${FastTokenizer.formatTokenCount(systemRulesTokens)}), MCP (${FastTokenizer.formatTokenCount(skillsMcpTokens)}), Messages (${FastTokenizer.formatTokenCount(messagesTokens)}), Tool Outputs (${FastTokenizer.formatTokenCount(toolOutputsTokens)})`
      ]
    });
    const availableConversations = this.listRecentConversations(10);
    const snapshot = {
      conversationId: convId,
      conversationTitle: convTitle || `\u4F1A\u8BDD ${convId.slice(0, 8)}`,
      source,
      lastUpdated: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
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
        `\u4F1A\u8BDD\u4EA4\u4E92\u5DF2\u8FBE ${turnCount} \u8F6E\uFF0C\u5360\u7528 ${percentage}% \u4E0A\u4E0B\u6587\u7A7A\u95F4`
      ],
      migrationPrompt,
      availableConversations
    };
    return snapshot;
  }
  /**
   * 启动实时监听
   */
  start(callback) {
    this.onUpdateCallback = callback;
    this.pollAndWatch();
    setInterval(() => {
      this.pollAndWatch();
    }, 2e3);
  }
  pollAndWatch(forceReload = false) {
    if (this.isScanning)
      return;
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
            if (filename === "transcript.jsonl" || filename === "transcript.json") {
              const updated = this.parseTranscriptFile(target.logPath, target.id, target.source);
              if (updated && this.onUpdateCallback) {
                this.onUpdateCallback(updated);
              }
            }
          });
        } catch {
        }
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
  stop() {
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }
  }
};

// src/extension/status-bar.ts
var vscode = __toESM(require("vscode"));
var ContextStatusBar = class {
  statusBarItem;
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "antigravity-context-meter.openPanel";
    this.statusBarItem.text = "$(circle-outline) 0.0%";
    this.statusBarItem.tooltip = "Antigravity \u4E0A\u4E0B\u6587\u8BA1\u91CF\u5668 (\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5)";
    this.statusBarItem.show();
  }
  /**
   * 异步轻量更新状态栏显示 (遵循宪法第二条)
   */
  update(snapshot) {
    const formattedUsed = FastTokenizer.formatTokenCount(snapshot.usedTokens);
    const formattedMax = FastTokenizer.formatTokenCount(snapshot.maxTokens);
    let icon = "$(circle-filled)";
    let color = void 0;
    if (snapshot.healthLevel === "optimal") {
      color = "#10b981";
    } else if (snapshot.healthLevel === "moderate") {
      color = "#f59e0b";
    } else if (snapshot.healthLevel === "warning") {
      color = "#f97316";
      icon = "$(warning)";
    } else if (snapshot.healthLevel === "critical") {
      color = "#ef4444";
      icon = "$(flame)";
    }
    this.statusBarItem.text = `${icon} ${snapshot.percentage.toFixed(1)}% (~${formattedUsed})`;
    this.statusBarItem.color = color;
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`### \u{1F9E0} Antigravity Context Meter

`);
    md.appendMarkdown(`- **\u5F53\u524D\u6A21\u578B**\uFF1A\`${snapshot.modelDisplayName}\`
`);
    md.appendMarkdown(`- **\u4E0A\u4E0B\u6587\u7528\u91CF**\uFF1A\`${formattedUsed} / ${formattedMax} Tokens\` (\`${snapshot.percentage}%\`)
`);
    md.appendMarkdown(`- **\u5065\u5EB7\u5EA6\u72B6\u6001**\uFF1A\`${snapshot.healthLevel.toUpperCase()}\`
`);
    md.appendMarkdown(`- **\u5F53\u524D\u8F6E\u6B21**\uFF1A\`${snapshot.turnCount} \u8F6E\`

`);
    md.appendMarkdown(`---
\u{1F449} **\u70B9\u51FB\u5C55\u5F00\u8BE6\u7EC6\u5206\u6BB5\u7528\u91CF\u4E0E Top \u6D88\u8017\u6EAF\u6E90\u9762\u677F**`);
    this.statusBarItem.tooltip = md;
  }
  dispose() {
    this.statusBarItem.dispose();
  }
};

// src/extension/webview-panel.ts
var vscode2 = __toESM(require("vscode"));
var path2 = __toESM(require("path"));
var fs2 = __toESM(require("fs"));
var ContextWebviewManager = class {
  panel = null;
  latestSnapshot = null;
  extensionUri;
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }
  updateSnapshot(snapshot) {
    this.latestSnapshot = snapshot;
    if (this.panel) {
      this.panel.webview.postMessage({
        type: "UPDATE_SNAPSHOT",
        payload: snapshot
      });
    }
  }
  show() {
    const column = vscode2.ViewColumn.Beside;
    if (this.panel) {
      this.panel.reveal(column);
      if (this.latestSnapshot) {
        this.updateSnapshot(this.latestSnapshot);
      }
      return;
    }
    this.panel = vscode2.window.createWebviewPanel(
      "antigravityContextMeter",
      "Context Usage",
      { viewColumn: column, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode2.Uri.joinPath(this.extensionUri, "src", "ui")]
      }
    );
    this.panel.webview.html = this.getHtmlContent(this.panel.webview);
    this.panel.webview.onDidReceiveMessage((msg) => {
      if (msg.command === "requestMigrationPrompt") {
        this.handleMigrationPrompt();
      }
    });
    this.panel.onDidDispose(() => {
      this.panel = null;
    });
    if (this.latestSnapshot) {
      setTimeout(() => {
        if (this.latestSnapshot)
          this.updateSnapshot(this.latestSnapshot);
      }, 100);
    }
  }
  handleMigrationPrompt() {
    if (!this.latestSnapshot)
      return;
    const migrationPrompt = this.latestSnapshot.migrationPrompt || ContextSummarizer.generateMigrationPrompt({
      projectName: vscode2.workspace.name || "\u5F53\u524D\u9879\u76EE",
      modelName: this.latestSnapshot.modelDisplayName,
      totalTokens: FastTokenizer.formatTokenCount(this.latestSnapshot.usedTokens),
      userObjectives: this.latestSnapshot.recentObjectives || ["\u63A8\u8FDB\u5F53\u524D\u9879\u76EE\u7684\u6838\u5FC3\u4EFB\u52A1"],
      modifiedFiles: this.latestSnapshot.modifiedFiles || [],
      recentDecisions: this.latestSnapshot.recentDecisions || ["\u901A\u8FC7 Antigravity Context Meter \u8FC1\u79FB\u81F3\u65B0\u4F1A\u8BDD"]
    });
    if (this.panel) {
      this.panel.webview.postMessage({
        type: "MIGRATION_PROMPT_READY",
        payload: migrationPrompt
      });
    }
  }
  getHtmlContent(webview) {
    const uiDir = path2.join(this.extensionUri.fsPath, "src", "ui");
    const htmlPath = path2.join(uiDir, "panel.html");
    const cssPath = path2.join(uiDir, "panel.css");
    const jsPath = path2.join(uiDir, "panel.js");
    let html = fs2.readFileSync(htmlPath, "utf8");
    const cssUri = webview.asWebviewUri(vscode2.Uri.file(cssPath));
    const jsUri = webview.asWebviewUri(vscode2.Uri.file(jsPath));
    html = html.replace('href="panel.css"', `href="${cssUri}"`);
    html = html.replace('src="panel.js"', `src="${jsUri}"`);
    return html;
  }
};

// src/extension/extension.ts
var logWatcher = null;
var statusBar = null;
var webviewManager = null;
function activate(context) {
  console.log("[Antigravity Context Meter] \u63D2\u4EF6\u5DF2\u6210\u529F\u6FC0\u6D3B");
  statusBar = new ContextStatusBar();
  webviewManager = new ContextWebviewManager(context.extensionUri);
  context.subscriptions.push(statusBar);
  const openCmd = vscode3.commands.registerCommand("antigravity-context-meter.openPanel", () => {
    if (webviewManager) {
      webviewManager.show();
    }
  });
  context.subscriptions.push(openCmd);
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
function deactivate() {
  if (logWatcher) {
    logWatcher.stop();
    logWatcher = null;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
