import { TopConsumerItem } from '../../types/context';
import { FastTokenizer } from './tokenizer';

/**
 * Top 消耗溯源分析器 (Stage 1)
 */
export class TopConsumersAnalyzer {
  /**
   * 从提取的事件列表中筛选并计算出占用最多的前 N 项操作
   */
  public static extractTopConsumers(
    rawEvents: Array<{
      id: string;
      stepIndex: number;
      type: 'tool_call' | 'tool_output' | 'user_input' | 'system_rules' | 'mcp_schema';
      name: string;
      rawContent: string;
      timestamp: string;
    }>,
    totalTokens: number,
    limit: number = 5
  ): TopConsumerItem[] {
    const scoredList: TopConsumerItem[] = [];

    for (const ev of rawEvents) {
      const tokens = FastTokenizer.countTokens(ev.rawContent);
      if (tokens < 30) continue; // 过滤过小的琐碎开销

      const percentage = totalTokens > 0 ? (tokens / totalTokens) * 100 : 0;

      let displayName = ev.name;
      let details = '';

      if (ev.type === 'tool_output') {
        if (ev.name.includes('view_file')) {
          displayName = `📄 查看文件内容 (${ev.name.split(':')[1]?.trim() || 'file'})`;
        } else if (ev.name.includes('run_command')) {
          displayName = `🖥️ 终端执行输出 (${ev.name.split(':')[1]?.trim() || 'command'})`;
        } else if (ev.name.includes('grep_search') || ev.name.includes('list_dir')) {
          displayName = `🔍 代码检索结果 (${ev.name})`;
        } else {
          displayName = `⚙️ 工具输出: ${ev.name}`;
        }
        details = ev.rawContent.slice(0, 150).replace(/\s+/g, ' ');
      } else if (ev.type === 'system_rules') {
        displayName = `🏛️ 全局系统规则与技能指令 (${ev.name})`;
        details = '系统级 Prompt、GEMINI.md 与内置 Agent 指令';
      } else if (ev.type === 'mcp_schema') {
        displayName = `🔌 MCP 服务工具 Schema (${ev.name})`;
        details = '注册的外部 MCP 协议工具定义';
      } else if (ev.type === 'user_input') {
        displayName = `💬 用户输入消息 (Step #${ev.stepIndex})`;
        details = ev.rawContent.slice(0, 150).replace(/\s+/g, ' ');
      }

      scoredList.push({
        id: ev.id,
        stepIndex: ev.stepIndex,
        type: ev.type,
        name: displayName,
        details,
        tokens,
        percentage: Math.round(percentage * 10) / 10,
        timestamp: ev.timestamp,
      });
    }

    // 按 Token 消耗降序排列并取 Top N
    scoredList.sort((a, b) => b.tokens - a.tokens);
    return scoredList.slice(0, limit);
  }
}
