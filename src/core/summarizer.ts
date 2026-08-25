/**
 * 一键提炼迁移 Prompt 生成器 (Stage 1)
 * 用于在上下文即将超限时，一键提炼出高质量的结构化 Markdown 摘要，方便在新会话中 0 遗忘无缝继续
 */
export class ContextSummarizer {
  /**
   * 基于会话中的关键信息提炼结构化迁移 Prompt
   */
  public static generateMigrationPrompt(params: {
    projectName: string;
    modelName: string;
    totalTokens: string;
    userObjectives: string[];
    modifiedFiles: string[];
    recentDecisions: string[];
  }): string {
    const { projectName, modelName, totalTokens, userObjectives, modifiedFiles, recentDecisions } = params;

    const prompt = `# 项目无缝接续上下文 (Context Migration Prompt)

> 本摘要由 **Antigravity Context Meter** 自动提炼。
> **前置会话用量**：~${totalTokens} Tokens | **基准模型**：${modelName}

---

## 🎯 核心目标与需求背景
${
  userObjectives.length > 0
    ? userObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')
    : '1. 继续推进当前项目的核心功能与架构实施。'
}

## 📝 已确认的关键技术决策与设计
${
  recentDecisions.length > 0
    ? recentDecisions.map((dec, i) => `- ${dec}`).join('\n')
    : '- 已建立项目核心宪法与分阶段开发规划。\n- 已确立核心架构与接口契约规范。'
}

## 📁 涉及的核心文件与代码资产
${
  modifiedFiles.length > 0
    ? modifiedFiles.map((f) => `- \`${f}\``).join('\n')
    : '- 暂无或直接基于当前工作区文件继续。'
}

## 🚀 接下来要做的事情
请读取以上背景与当前工作区，无需重新解释架构，直接无缝继续推进下一步具体任务！
`;

    return prompt;
  }
}
