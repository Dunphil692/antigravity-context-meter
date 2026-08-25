/**
 * Antigravity Context Meter - 前端交互与数据渲染逻辑 (Stage 2)
 */

// 兼容 VS Code Webview 通信机制
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

// 格式化函数
function formatTokens(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString();
}

let currentSnapshot = null;

/**
 * 核心渲染函数：更新整个面板状态
 */
function renderSnapshot(snapshot) {
  if (!snapshot) return;
  currentSnapshot = snapshot;

  // 1. 顶部基础信息
  document.getElementById('model-badge').innerText = snapshot.modelDisplayName || snapshot.modelName || 'Gemini Flash';
  document.getElementById('turn-badge').innerText = `${snapshot.turnCount || 0} 轮交互`;

  // 2. 核心百分比与总数
  const percentEl = document.getElementById('percent-val');
  percentEl.innerText = snapshot.percentage.toFixed(1);
  percentEl.className = `health-${snapshot.healthLevel}`;

  document.getElementById('used-tokens').innerText = formatTokens(snapshot.usedTokens);
  document.getElementById('max-tokens').innerText = formatTokens(snapshot.maxTokens);

  // 3. 计算多色分段条百分比 (以 maxTokens 为 100% 基准)
  const max = snapshot.maxTokens || 1000000;
  const b = snapshot.breakdown || {
    systemRulesTokens: 0,
    skillsMcpTokens: 0,
    messagesTokens: 0,
    toolOutputsTokens: 0,
    metadataTokens: 0,
  };

  const pRules = (b.systemRulesTokens / max) * 100;
  const pMcp = (b.skillsMcpTokens / max) * 100;
  const pMsg = (b.messagesTokens / max) * 100;
  const pOut = (b.toolOutputsTokens / max) * 100;
  const pMeta = (b.metadataTokens / max) * 100;

  document.getElementById('seg-rules').style.width = `${pRules}%`;
  document.getElementById('seg-mcp').style.width = `${pMcp}%`;
  document.getElementById('seg-messages').style.width = `${pMsg}%`;
  document.getElementById('seg-outputs').style.width = `${pOut}%`;
  document.getElementById('seg-meta').style.width = `${pMeta}%`;

  // 4. 明细图例更新
  document.getElementById('val-rules').innerText = formatTokens(b.systemRulesTokens);
  document.getElementById('val-mcp').innerText = formatTokens(b.skillsMcpTokens);
  document.getElementById('val-messages').innerText = formatTokens(b.messagesTokens);
  document.getElementById('val-outputs').innerText = formatTokens(b.toolOutputsTokens);

  // 5. Top 消耗列表渲染
  const topListEl = document.getElementById('top-consumers-list');
  if (!snapshot.topConsumers || snapshot.topConsumers.length === 0) {
    topListEl.innerHTML = `
      <div class="ag-top-item" style="color: var(--text-muted); justify-content: center;">
        当前会话无大文件或长日志消耗
      </div>
    `;
  } else {
    topListEl.innerHTML = snapshot.topConsumers
      .map((item, idx) => `
        <div class="ag-top-item">
          <span class="ag-top-name" title="${item.name}">${idx + 1}. ${item.name}</span>
          <span class="ag-top-tokens">${formatTokens(item.tokens)} (${item.percentage}%)</span>
        </div>
      `)
      .join('');
  }
}

// 提示 Toast 动效
function showToast(msg) {
  const toast = document.getElementById('ag-toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// 绑定一键提炼迁移 Prompt 按钮
document.getElementById('btn-migrate').addEventListener('click', () => {
  if (vscode) {
    vscode.postMessage({ command: 'requestMigrationPrompt' });
  } else if (currentSnapshot && currentSnapshot.migrationPrompt) {
    navigator.clipboard.writeText(currentSnapshot.migrationPrompt).then(() => {
      showToast('已复制结构化迁移 Prompt 到剪贴板！');
    });
  } else {
    // 默认兜底
    const defaultSummary = `# 项目无缝接续上下文 (Context Migration Prompt)

> 由 Antigravity Context Meter 自动提炼生成。

## 🎯 核心目标
继续推进当前工作区的核心功能与代码实现。

## 🚀 接下来要做的事情
请读取当前工作区最新代码，无需重新解释架构，直接无缝继续推进下一步具体任务！
`;
    navigator.clipboard.writeText(defaultSummary).then(() => {
      showToast('已复制结构化迁移 Prompt 到剪贴板！');
    });
  }
});

// 监听来自 VS Code 插件或 WebSocket 的实时数据更新
window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type === 'UPDATE_SNAPSHOT') {
    renderSnapshot(message.payload);
  } else if (message.type === 'MIGRATION_PROMPT_READY') {
    navigator.clipboard.writeText(message.payload).then(() => {
      showToast('已复制结构化迁移 Prompt 到剪贴板！');
    });
  }
});
