/**
 * Antigravity Context Meter - 核心数据契约与接口定义 (Stage 0 ~ 4)
 */

/** 健康度四级预警状态 */
export type HealthLevel = 'optimal' | 'moderate' | 'warning' | 'critical';

/** 各类上下文构成细项 */
export interface ContextBreakdown {
  /** 系统提示词、全局规则 (GEMINI.md / AGENTS.md / rules) */
  systemRulesTokens: number;
  /** 技能与 MCP 工具定义 (Skills & MCP tool schemas) */
  skillsMcpTokens: number;
  /** 用户与助手对话消息 (User & Assistant messages) */
  messagesTokens: number;
  /** 工具调用返回结果与长日志 (Tool execution outputs & files) */
  toolOutputsTokens: number;
  /** 其他/系统附加元数据 */
  metadataTokens: number;
}

/** 单次高消耗操作溯源条目 */
export interface TopConsumerItem {
  id: string;
  stepIndex: number;
  type: 'tool_call' | 'tool_output' | 'user_input' | 'system_rules' | 'mcp_schema';
  name: string;
  details: string;
  tokens: number;
  percentage: number;
  timestamp: string;
}

/** 会话元数据项（用于项目/会话多选下拉列表） */
export interface ConversationItem {
  id: string;
  source: 'desktop' | 'ide';
  sourceLabel: string;
  title: string;
  lastModified: number;
  lastUpdatedStr: string;
  logPath: string;
}

/** 当前会话上下文用量完整快照 */
export interface ContextUsageSnapshot {
  conversationId: string;
  conversationTitle?: string;
  source: 'desktop' | 'ide';
  lastUpdated: string;
  modelName: string;
  modelDisplayName: string;
  maxTokens: number;
  usedTokens: number;
  percentage: number;
  healthLevel: HealthLevel;
  breakdown: ContextBreakdown;
  topConsumers: TopConsumerItem[];
  turnCount: number;
  isActive: boolean;
  recentObjectives?: string[];
  modifiedFiles?: string[];
  recentDecisions?: string[];
  migrationPrompt?: string;
  availableConversations?: ConversationItem[];
}

/** 模型容量标准注册表 */
export interface ModelContextSpec {
  namePattern: RegExp;
  displayName: string;
  maxTokens: number;
  warningThreshold: number; // 默认 0.75 (75%)
  criticalThreshold: number; // 默认 0.85 (85%)
}

/** 内置主流模型规范表（对齐官方标准） */
export const BUILTIN_MODEL_SPECS: ModelContextSpec[] = [
  {
    namePattern: /gemini.*flash/i,
    displayName: 'Gemini Flash (1M)',
    maxTokens: 1048576,
    warningThreshold: 0.75,
    criticalThreshold: 0.85,
  },
  {
    namePattern: /gemini.*pro/i,
    displayName: 'Gemini Pro (2M)',
    maxTokens: 2097152,
    warningThreshold: 0.75,
    criticalThreshold: 0.85,
  },
  {
    namePattern: /claude/i,
    displayName: 'Claude 3.5/3.7 (200K)',
    maxTokens: 200000,
    warningThreshold: 0.75,
    criticalThreshold: 0.85,
  },
  {
    namePattern: /gpt-4o|o1|o3/i,
    displayName: 'OpenAI GPT-4o (128K)',
    maxTokens: 128000,
    warningThreshold: 0.75,
    criticalThreshold: 0.85,
  },
  {
    namePattern: /deepseek/i,
    displayName: 'DeepSeek V3/R1 (128K)',
    maxTokens: 128000,
    warningThreshold: 0.75,
    criticalThreshold: 0.85,
  },
];

/** 默认兜底规格 */
export const DEFAULT_MODEL_SPEC: ModelContextSpec = {
  namePattern: /.*/,
  displayName: 'Standard Model (128K)',
  maxTokens: 128000,
  warningThreshold: 0.75,
  criticalThreshold: 0.85,
};
