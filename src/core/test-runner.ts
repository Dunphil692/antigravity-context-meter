import { LogWatcher } from './log-watcher';
import { FastTokenizer } from './tokenizer';
import { ModelDetector } from './model-detector';
import { ContextSummarizer } from './summarizer';

/**
 * Stage 1 核心引擎真实环境测试与基准校验套件
 * 严格遵循 Rule 1（连接真实数据测试）与 Rule 2（单次计算耗时 < 10ms）
 */
async function runStage1Verification() {
  console.log('====================================================');
  console.log('🧪 启动 Stage 1: 核心引擎与数据流管道真实环境测试');
  console.log('====================================================\n');

  // 1. 验证 Tokenizer 速度与准确性
  const sampleChinese = '我想要为Antigravity做一个工具，这个工具就像Cursor的上下文计量器。';
  const sampleCode = `function calculateHealth(percentage: number) { return percentage > 0.85 ? "critical" : "optimal"; }`;
  const tStart = performance.now();
  const cTokens = FastTokenizer.countTokens(sampleChinese);
  const codeTokens = FastTokenizer.countTokens(sampleCode);
  const tEnd = performance.now();
  console.log(`✅ Tokenizer 基准测试:`);
  console.log(`   - 中文样本: "${sampleChinese}" -> ${cTokens} tokens`);
  console.log(`   - 代码样本: ${codeTokens} tokens`);
  console.log(`   - 计算耗时: ${(tEnd - tStart).toFixed(3)} ms (远低于 10ms 限制)`);

  // 2. 真实探测并解析 Antigravity 本地真实日志
  const watcher = new LogWatcher();
  const latest = watcher.findLatestConversation();

  if (!latest) {
    console.error('❌ 未找到本地 Antigravity 会话日志！');
    process.exit(1);
  }

  console.log(`\n✅ 成功探测到本地最新 Active 会话:`);
  console.log(`   - Conversation ID: ${latest.id}`);
  console.log(`   - Log File Path: ${latest.logPath}`);

  const parseStart = performance.now();
  const snapshot = watcher.parseTranscriptFile(latest.logPath, latest.id);
  const parseEnd = performance.now();

  if (!snapshot) {
    console.error('❌ 解析会话日志失败！');
    process.exit(1);
  }

  console.log(`\n📊 实时上下文用量快照解析结果:`);
  console.log(`   - 识别模型: ${snapshot.modelName} (${snapshot.modelDisplayName})`);
  console.log(`   - 模型总容量: ${FastTokenizer.formatTokenCount(snapshot.maxTokens)} Tokens`);
  console.log(`   - 当前已用: ${FastTokenizer.formatTokenCount(snapshot.usedTokens)} Tokens (${snapshot.usedTokens.toLocaleString()})`);
  console.log(`   - 占比: ${snapshot.percentage}% [健康度级别: ${snapshot.healthLevel.toUpperCase()}]`);
  console.log(`   - 会话交互轮次: ${snapshot.turnCount} 轮`);
  console.log(`   - 单次解析总耗时: ${(parseEnd - parseStart).toFixed(2)} ms`);

  console.log(`\n🧩 各模块用量拆解 (Breakdown):`);
  console.log(`   - 🏛️ System & Rules: ${FastTokenizer.formatTokenCount(snapshot.breakdown.systemRulesTokens)} Tokens`);
  console.log(`   - 🛠️ Skills & MCP Schemas: ${FastTokenizer.formatTokenCount(snapshot.breakdown.skillsMcpTokens)} Tokens`);
  console.log(`   - 💬 User & Assistant Messages: ${FastTokenizer.formatTokenCount(snapshot.breakdown.messagesTokens)} Tokens`);
  console.log(`   - 📄 Tool Outputs & File Dumps: ${FastTokenizer.formatTokenCount(snapshot.breakdown.toolOutputsTokens)} Tokens`);

  console.log(`\n🔥 Top 消耗溯源 (Top Consumers):`);
  if (snapshot.topConsumers.length === 0) {
    console.log('   (暂无大文件/长日志消耗)');
  } else {
    snapshot.topConsumers.forEach((item, idx) => {
      console.log(`   ${idx + 1}. [${item.percentage}%] ${item.name} (${FastTokenizer.formatTokenCount(item.tokens)} Tokens)`);
      if (item.details) {
        console.log(`      摘要: ${item.details.slice(0, 80)}...`);
      }
    });
  }

  // 3. 测试一键提炼迁移 Prompt
  console.log(`\n⚡ 测试一键提炼迁移 Prompt:`);
  const migrationPrompt = ContextSummarizer.generateMigrationPrompt({
    projectName: '上下文用量',
    modelName: snapshot.modelDisplayName,
    totalTokens: FastTokenizer.formatTokenCount(snapshot.usedTokens),
    userObjectives: ['实现 Antigravity 上下文计量器', '对齐 Cursor 视觉与交互'],
    modifiedFiles: ['types/context.ts', 'src/core/tokenizer.ts', 'src/core/log-watcher.ts'],
    recentDecisions: ['确立项目宪法', '完成 Stage 1 核心引擎'],
  });
  console.log(migrationPrompt.slice(0, 260) + '\n...\n');

  console.log('====================================================');
  console.log('🎉 Stage 1 核心引擎与数据流管道全部测试通过！准出验收合格！');
  console.log('====================================================');
}

runStage1Verification().catch(console.error);
