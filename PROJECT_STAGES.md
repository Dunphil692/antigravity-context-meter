# 《Antigravity 上下文计量器项目阶段与阶段规则》
(Project Lifecycle Stages & Gating Rules)

本项目严格划分为 **6 个推进阶段 (Stage 0 ~ Stage 5)**。每个 Stage 均设定明确的 **目标 (Goal)**、**产出物 (Deliverables)**、**阶段铁律 (Stage Rules)** 与 **准入/准出准则 (Gate Criteria)**。

---

## 📌 Stage 0: 架构基建与宪法确立 (Architecture & Constitution Setup)
* **目标**：明确项目技术选型、目录结构、数据流拓扑与接口契约，签署项目宪法。
* **阶段铁律 (Rule 0)**：
  > 🚫 **本阶段严禁编写任何业务逻辑代码。只定标准、目录结构、数据接口契约与依赖清单。**
* **核心产出物**：
  - `CONSTITUTION.md`（项目宪法）
  - `PROJECT_STAGES.md`（阶段定义与规则文档）
  - 项目根目录结构搭建与 `package.json` 依赖初始化
  - 数据模型契约定义（`types/context.ts` 或接口规范）
* **准出准则 (Gate 0)**：宪法与阶段规划获得确认，工程目录初始化完毕。

---

## 📌 Stage 1: 核心引擎与数据流管道 (Core Engine & Log Parser Pipeline)
* **目标**：实现真实日志监听、增量解析、模型识别、Token 精准估算与 Top 消耗溯源。
* **阶段铁律 (Rule 1)**：
  > 🚫 **严禁使用 Mock 模拟数据自嗨。必须连接真实的 `transcript.jsonl` 日志，通过实际会话文件进行单元与边界测试。**
* **核心产出物**：
  - `src/core/log-watcher.ts`：跨平台实时日志增量监听器（支持最新 active 会话自动探测）
  - `src/core/tokenizer.ts`：毫秒级高性能 Token 计算引擎（按 System/Skills/Messages/Tools 细粒度拆分）
  - `src/core/model-detector.ts`：模型识别与自适应窗口大小引擎（Gemini 1M/2M、Claude 200K、DeepSeek 64K 等）
  - `src/core/top-consumers.ts`：Top 5 消耗操作溯源与分析算法
  - `src/core/summarizer.ts`：一键生成新会话结构化迁移 Prompt 提炼算法
* **准出准则 (Gate 1)**：通过真实会话日志压测，单次解析耗时 < 10ms，解析准确率达到预期。

---

## 📌 Stage 2: Cursor 级高质感 UI 面板与动效 (High-Fidelity UI & Interactions)
* **目标**：设计并实现 1:1 Cursor 质感的前端毛玻璃面板与小圆环组件。
* **阶段铁律 (Rule 2)**：
  > 🚫 **严禁使用粗糙廉价的默认样式，严禁引入重量级前端框架包。必须使用纯净现代 CSS/JS，实现像素级质感、毛玻璃背景与丝滑微动效。**
* **核心产出物**：
  - `src/ui/meter-circle.svg / .css`：右下角常驻状态指示环（支持四色自适应切换与呼吸光效）
  - `src/ui/panel.html`：用量详情主面板（深色毛玻璃、多色分段条、百分比徽标）
  - `src/ui/top-consumers-view.js`：Top 消耗折叠卡片组件
  - `src/ui/summary-export-modal.js`：一键提炼与一键复制新会话 Prompt 弹窗交互
* **准出准则 (Gate 2)**：UI 视觉与 Cursor 原型 100% 对齐，具备流畅动画，无布局抖动。

---

## 📌 Stage 3: IDE 插件封装与状态栏接入 (VS Code / IDE Extension Integration)
* **目标**：将核心引擎与 UI 封装为 Antigravity IDE / VS Code 原生插件包（`.vsix`）。
* **阶段铁律 (Rule 3)**：
  > 🚫 **严禁侵入或污染 IDE 主渲染线程。状态栏更新必须采用异步轻量更新机制，热插拔即装即用。**
* **核心产出物**：
  - `extension.ts`：VS Code 插件入口
  - `src/extension/status-bar.ts`：右下角 Status Bar 原生小圆环挂载器
  - `src/extension/webview-panel.ts`：点击状态栏时原地弹出的 Webview 交互控制器
  - 打包生成 `antigravity-context-meter-1.0.0.vsix`
* **准出准则 (Gate 3)**：在 Antigravity IDE 中安装 `.vsix` 后，右下角立即可见小圆环，点击平滑展开面板。

---

## 📌 Stage 4: 全局独立悬浮窗 / 菜单栏组件封装 (macOS Global Overlay Widget)
* **目标**：为在“没有 IDE 的独立客户端/全屏聊天”场景提供常驻悬浮小胶囊和顶部菜单栏组件。
* **阶段铁律 (Rule 4)**：
  > 🚫 **必须做到极小体积、极低资源占用（后台常驻 CPU < 0.1%，内存 < 25MB），支持拖拽与智能吸附。**
* **核心产出物**：
  - `src/desktop/main.js`：轻量桌面常驻小进程（基于轻量 Webview/Electron/Native）
  - 屏幕右下角可拖拽半透明胶囊 `[ ◍ 11% ]`
  - macOS 顶部菜单栏快捷托盘图标与点击弹窗
* **准出准则 (Gate 4)**：无需打开 IDE，直接在 macOS 桌面独立运行，能跨窗口全局实时同步当前会话用量。

---

## 📌 Stage 5: 真实场景联调、多模型压测与一键交付 (End-to-End Test & Release)
* **目标**：在真实数十万 Token 的长对话与复杂任务中进行全链路实测、极限边界测试与发布交付。
* **阶段铁律 (Rule 5)**：
  > 🚫 **未经过真实大文件读取、连续长对话与模型切换压测的工具禁止正式发布交付。**
* **核心产出物**：
  - 全链路测试报告与性能指标统计
  - 一键安装脚本与使用指南 `README.md`
  - 正式发布打包产物（`.vsix` 插件包 + macOS 独立运行程序）
* **准出准则 (Gate 5)**：多模型自适应正常，Top 溯源准确，一键迁移摘要可用，性能与内存达标。
