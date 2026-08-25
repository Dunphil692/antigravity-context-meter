<div align="center">

# 💊 Antigravity Context Meter

<p align="center">
  <b>1:1 Cursor 级极简实时上下文计量器与 0 遗忘智能迁移工具</b><br/>
  <i>Real-time Context Usage Meter & Zero-Loss Session Migration for Google Antigravity (Desktop & IDE)</i>
</p>

<p align="center">
  <a href="README.md">English</a> •
  <b>简体中文</b>
</p>

<p align="center">
  <a href="https://github.com/Dunphil692/antigravity-context-meter/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-emerald.svg?style=flat-square" alt="Version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20IDE%20%7C%20VS%20Code-purple.svg?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Speed-0.039ms%20%2F%200%20Token-orange.svg?style=flat-square" alt="Speed" />
  <a href="https://github.com/Dunphil692/antigravity-context-meter/stargazers"><img src="https://img.shields.io/github/stars/Dunphil692/antigravity-context-meter?style=flat-square&color=yellow" alt="Stars" /></a>
  <a href="https://github.com/Dunphil692/antigravity-context-meter/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
</p>

<p align="center">
  <a href="#-核心特性-key-features">核心特性</a> •
  <a href="#-实机效果展示-showcase">实机展示</a> •
  <a href="#-极速安装使用-quick-start">极速上手</a> •
  <a href="#-为什么需要它-the-problem">设计初衷</a> •
  <a href="#-性能基准-benchmark">性能基准</a> •
  <a href="#-参与贡献-contributing">参与贡献</a>
</p>

<br/>

<!-- Hero Image Showcase -->
<p align="center">
  <img src="assets/preview-capsule.png" alt="Mini Capsule" width="280" />
  <br/><br/>
  <img src="assets/preview-card.png" alt="Context Meter Panel" width="420" />
</p>

</div>

---

## 💡 为什么需要它？(The Problem We Solve)

在使用 **Google Antigravity** 或各类自主 Agentic AI 进行多轮复杂开发时，你是否遇到过以下痛点：

1. **上下文黑盒**：不知道什么时候 Token 会满，直到模型开始**遗忘前置代码、逻辑退化、产生幻觉**才后知后觉。
2. **查用量反倒费 Token**：在聊天框询问 `/context` 不仅占用对话轮次，还会**反向消耗大量模型 Token** 并污染代码上下文。
3. **长会话难以平滑迁移**：当会话达到 80%~90% 上限不得不开新窗口时，手动总结前置进度极其费时，经常遗漏关键决策。

**Antigravity Context Meter** 彻底解决了这一切 —— 采用与 Cursor 1:1 对齐的极简美学，提供**纯本地 0 Token 消耗的实时监控与一键 0 遗忘迁移**。

---

## ✨ 核心特性 (Key Features)

### 🎨 1. 1:1 Cursor 级深色毛玻璃美学
- **动态环形进度**：实时呈现用量百分比与绿/黄/橙/红四级健康度状态。
- **四色分段发光条**：清晰拆解 **Rules (系统规则)**、**MCP (工具定义)**、**Messages (用户对话)** 与 **Outputs (工具大输出)**。
- **macOS 原生沉浸感**：`backdrop-filter: blur(28px)` 深色毛玻璃 HUD，细节丝滑。

### ⚡ 2. 纯本地静默监听 (0 Token 消耗 & 0.039ms 极速)
- 完全通过本地事件驱动日志流（Event-driven IO）静默计算。
- **不调用任何外部 API、不发送任何 Prompt、不消耗任何额外 Token**。
- 自研混合分词引擎单次计算耗时仅 **0.039 毫秒**，CPU 占用日常为 **0.0%**。

### 🗂️ 3. 多项目/多会话独立自由切换与锁定
- 无论你在桌面端开着几个项目，还是在 IDE 端并发协作，下拉菜单自动罗列所有活动项目。
- 支持**一键锁定监控特定项目**，或开启**⚡ 自动跟随最新活动项目**。

<p align="center">
  <img src="assets/preview-sessions.png" alt="Multi Session Selector" width="460" />
</p>

### 🔥 4. Top 5 大开销操作精准溯源
- 毫秒级抓取会话中占用 Token 最多的 5 次操作（如哪一次 `run_command` 输出了超长日志、哪一篇文件读取过大），一目了然。

### 🚀 5. 一键 0 遗忘提炼迁移 Prompt (Zero-Loss Migration)
- 在上下文接近饱和（75%~85%）时，点击 **`⚡ 一键提炼新会话 Prompt`**；
- 智能提炼已完成成果、关键决策与未完成任务，在新窗口粘贴即可实现**100% 记忆接续**！

---

## 🖥️ 双模独立形态 (Dual-Mode Architecture)

本项目支持两种独立形态，按需选用：

| 形态 | 适用场景 | 技术栈 | 体积 / 内存占用 |
| :--- | :--- | :--- | :--- |
| **💊 独立桌面悬浮小胶囊 (Desktop Capsule)** | 适用于独立 Antigravity 客户端、全屏写代码时常驻监控 | macOS 原生 Cocoa + WebKit | **仅 53 KB** / ~15MB RAM |
| **🛠️ IDE 原生状态栏插件 (IDE Extension)** | 适用于 Antigravity IDE / VS Code 内嵌开发 | VS Code Extension API | **仅 68 KB** (.vsix) |

---

## 🚀 极速安装与使用 (Quick Start)

### 选项 A：使用独立桌面悬浮小胶囊 (macOS)

```bash
# 1. 克隆本仓库
git clone https://github.com/Dunphil692/antigravity-context-meter.git
cd antigravity-context-meter

# 2. 一键启动悬浮小胶囊（后台常驻，屏幕右上角显示）
./start-capsule.sh

# 3. 如需关闭，运行:
./stop-capsule.sh
# （或者直接在展开的卡片右上角点击红色的 [✕] 按钮退出）
```

### 选项 B：在 Antigravity IDE / VS Code 中安装插件

1. 前往 [Releases 页面](https://github.com/Dunphil692/antigravity-context-meter/releases/latest) 下载 `antigravity-context-meter-1.0.0.vsix`；
2. 打开 Antigravity IDE / VS Code，进入插件面板 (`Cmd+Shift+X`)；
3. 点击右上角菜单 `...` -> 选择 **`Install from VSIX...`**；
4. 状态栏右下角即可看到实时用量小圆标！

---

## 📊 性能基准测试 (Benchmark)

在 M-series Mac 上对 100 轮超长对话、20 万字符的真实工程日志进行压测：

| 评估指标 | Antigravity Context Meter | 传统向 AI 问答 (/context) | 优势 |
| :--- | :---: | :---: | :---: |
| **API Token 消耗** | **0 Token** | 每次消耗 1,000 ~ 5,000 Tokens | 🟢 **100% 零成本** |
| **响应耗时** | **0.039 ms** | 1.5 s ~ 3.0 s | 🟢 **快 50,000 倍** |
| **应用体积** | **53 KB** (原生) | - | 🟢 **极致轻量** |
| **日常 CPU 占用** | **0.0% ~ 0.1%** | - | 🟢 **无感省电** |

---

## 🗺️ 路线图 (Roadmap)

- [x] 1:1 Cursor 级深色毛玻璃 UI 与多色分段条
- [x] 多项目与多会话下拉切换与独立锁定
- [x] macOS 原生置顶透明悬浮小胶囊 (Cocoa HUD)
- [x] 75%~85% 上下文一键 0 遗忘迁移 Prompt 生成
- [ ] 支持 Windows / Linux 悬浮窗适配
- [ ] 支持用户自定义告警阈值（如 60%/80% 触发桌面通知）
- [ ] 官方 Antigravity 插件中心一键分发支持

---

## 🤝 参与贡献 (Contributing)

我们非常欢迎社区 Contributors 加入！无论是提出 Issue、优化 UI 动效、还是适配新平台：

1. **Fork** 本项目
2. 创建你的特性分支 (`git checkout -b feature/CoolFeature`)
3. 提交你的代码 (`git commit -m 'feat: Add CoolFeature'`)
4. 推送到分支 (`git push origin feature/CoolFeature`)
5. 开启一个 **Pull Request**

---

## 📄 开源协议 (License)

本项目基于 [MIT License](LICENSE) 开源。欢迎自由使用、学习与修改！

<div align="center">
  <sub>Made with ❤️ for the Antigravity & Agentic AI Community</sub>
</div>
