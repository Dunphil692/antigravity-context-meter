# 《Antigravity 上下文计量器项目宪法》
(Project Constitution & Operating Principles)

> **版本**：v1.0.0  
> **生效日期**：2026-08-25  
> **核心使命**：为 Antigravity 打造极致精准、高颜值、零性能损耗的实时上下文 Token 计量与健康度监控工具，彻底解决长对话中模型注意力衰退、代码遗忘与幻觉问题。

---

## 🏛️ 核心宪法五大原则 (The 5 Fundamental Articles)

### 第一条：真实数据第一性原则 (Zero-Mock Real-Time Truth)
1. **唯一事实来源**：计量器所有数据必须严格基于本地 Antigravity 真实生成的活动会话日志（`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`），严禁使用随机模拟数据上线。
2. **多层拆解精确度**：必须精准拆解 **System Rules（规则）**、**Skills / MCP Tools（工具定义）**、**Messages（用户/助手对话）** 以及 **Tool Results / Artifacts（工具调用与长日志）** 的实际占用比例。

### 第二条：零性能损耗与无感原则 (Zero Performance Penalty)
1. **轻量与低负载**：监控引擎必须采用增量流式文件监听与差异解析机制，单次 Token 计算耗时严格控制在 **10ms 以内**，常驻内存占用 **< 30MB**。
2. **绝不阻塞**：后台计算与 UI 渲染严禁以任何形式阻塞 Antigravity IDE 正常写代码或 Agent 对话流程。

### 第三条：极致美学与 1:1 质感原则 (High-Fidelity Aesthetics)
1. **拒绝简陋**：UI 界面必须完全对齐现代顶级开发工具（如 Cursor）的设计水准，采用 **深色毛玻璃（Dark Glassmorphism）**、精心调配的语义化多色分段进度条、平滑的过渡动画与动态呼吸预警光效。
2. **信息层级分明**：常态保持极简（仅一个小圆环与百分比），展开状态呈现丰富、清晰、不拥挤的数据拆解。

### 第四条：双模适配与模型自适应原则 (Dual-Mode & Multi-Model Adaptability)
1. **双端形态同构**：同时保证 **Antigravity IDE 插件（状态栏原生）** 与 **全局独立悬浮组件（适用于独立桌面端/全屏）** 的数据同源与体验一致性。
2. **智能窗口自适应**：必须自动根据当前会话所选模型（如 Gemini 1M/2M、Claude 200K、DeepSeek 64K/128K 等）自适应调整 100% 基准阈值，支持用户手动自定义覆盖。

### 第五条：主动止损与上下文保全原则 (Loss Prevention & Context Preservation)
1. **健康度四级预警**：
   - 🟢 `0% ~ 50%`：**Optimal**（最佳理解力，翠绿）
   - 🟡 `50% ~ 70%`：**Moderate**（适度，琥珀黄）
   - 🟠 `70% ~ 85%`：**Warning**（告警，警戒橙）
   - 🔴 `> 85%`：**Critical**（高危，呼吸红光，建议立即收尾或新开会话）
2. **Top 消耗溯源**：必须提供一键查看“占用 Token 最大的前 5 次操作（如某次读大文件或打印长日志）”。
3. **一键提炼迁移 Prompt**：在告警区支持一键生成当前项目进展与决策的结构化迁移摘要，实现跨会话 0 遗忘无缝流转。

---

## ⚖️ 开发红线 (Non-Negotiable Red Lines)
1. ❌ **严禁破坏 Antigravity 原有系统文件与目录**（仅以只读方式监听日志）。
2. ❌ **严禁引入笨重且不必要的第三方超大依赖包**。
3. ❌ **未通过阶段规则验收（Gate Rule）的代码严禁合入下一个阶段**。
