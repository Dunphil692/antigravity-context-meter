# 💊 Antigravity Context Meter (上下文计量器)

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/Version-v1.0.0-emerald.svg" alt="Version" />
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Antigravity%20IDE%20%7C%20VS%20Code-purple.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Tech-TypeScript%20%7C%20Cocoa%20WebKit-orange.svg" alt="Tech" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

<p align="center">
  <b>为 Google Antigravity 打造的 1:1 Cursor 级实时上下文用量监控与 0 遗忘迁移工具。</b><br/>
  <i>Real-time Context Usage Meter & Zero-Loss Session Migration for Antigravity (Desktop & IDE).</i>
</p>

---

## ✨ 核心特性 (Key Features)

- 🎨 **1:1 Cursor 级极致美学**：深色毛玻璃 HUD（`backdrop-filter: blur(28px)`）、动态环形光圈、四色分段发光用量条（Rules / MCP / Messages / Outputs）。
- ⚡ **纯本地零消耗监听 (Zero Token & 0.039ms)**：纯本地实时读取与高速分词，**不发任何提示词、不消耗任何 API Token**，单次计算仅耗时 0.039ms，CPU 占用 0.0%。
- 🧠 **全模型智能感知**：自适应识别 Gemini 3.7 Flash/Pro (1M/2M)、Claude 3.7 Sonnet (200K)、DeepSeek V3/R1 (128K) 等官方窗口，提供绿/黄/橙/红四级健康度预警。
- 🔥 **Top 5 大开销操作精准溯源**：毫秒级找出是哪一次工具调用、哪一篇文件读取或哪一轮长回复占用了最多的上下文。
- 🚀 **一键 0 遗忘迁移新会话**：上下文达到 75%~85% 预警时，一键提炼前置会话的核心决策与未完成任务，在新会话粘贴即无缝接续。
- 🖥️ **双模独立形态支持**：
  1. **独立桌面悬浮小胶囊 (Desktop Floating Capsule)**：基于 macOS 原生 Cocoa 编译（体积仅 **53 KB**），全局置顶常驻，跨桌面 Space 自由拖拽，支持多项目下拉切换。
  2. **IDE 原生插件 (VS Code / Antigravity IDE Extension)**：一键安装 `.vsix`，常驻右下角状态栏小圆标，点击即弹窗。

---

## 🏗️ 双模形态使用指南 (Quick Start)

### 1. 桌面端独立悬浮小胶囊 (macOS Native Capsule)

适用于独立的 Antigravity 桌面端应用或不想在 IDE 内开插件的用户：

```bash
# 启动悬浮小胶囊（后台守护常驻，屏幕右上角显示）
./start-capsule.sh

# 关闭悬浮小胶囊（或直接在面板上点击红色的 [✕] 按钮）
./stop-capsule.sh
```

### 2. IDE 端原生插件 (Antigravity IDE / VS Code)

适用于 Antigravity IDE 或 VS Code 用户：
1. 下载 Release 页面中的 `antigravity-context-meter-1.0.0.vsix`；
2. 在 IDE 扩展面板中点击右上角 `...` -> **`Install from VSIX...`**；
3. 右下角状态栏即可看到小圆环实时用量，点击即可展开完整分析面板。

---

## 🏛️ 项目宪法 (Constitution)

本项目严格遵循以下五大原则：
1. **真实数据第一性 (Truthful Data)**：用量必须基于真实日志流，杜绝伪造与静态估算。
2. **零性能损耗与零 Token 消耗 (Zero Overhead)**：完全本地静默运行，不得向 AI 发送提问消耗 Token。
3. **1:1 Cursor 质感 (Pixel-Perfect Polish)**：拒绝粗糙粗糙的半成品，追求极其细腻的毛玻璃与动效体验。
4. **双模自适应 (Dual-Mode Adaptation)**：同时完美服务于独立桌面客户端与 IDE 插件。
5. **主动止损 (Proactive Preservation)**：在上下文膨胀导致模型失忆前，提供一键结构化迁移方案。

---

## 🛠️ 本地构建与开发 (Development)

```bash
# 安装依赖
npm install

# 编译 TypeScript 与打包 Webview
node esbuild.config.js

# 编译 macOS 原生透明悬浮窗 (clang Objective-C)
clang -fobjc-arc -O2 src/desktop/macos/main.m -o dist/AntigravityCapsule -framework Cocoa -framework WebKit

# 打包 VSIX 插件
npx -y @vscode/vsce package --allow-missing-repository --no-dependencies
```

---

## 🤝 参与贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！让我们一起把 Antigravity 生态建设得更加强大！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议 (License)

本项目采用 [MIT License](LICENSE) 开源协议。
