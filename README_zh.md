<div align="center">

# 💊 Antigravity Context Meter (上下文用量计量器)

<p align="center">
  <b>1:1 极简沉浸式 Antigravity 实时上下文用量监控与 0 遗忘会话迁移工具</b><br/>
  <i>高精度静默本地分词，全局常驻置顶悬浮小胶囊，智能防失忆 Prompt 一键提取。</i>
</p>

<p align="center">
  <a href="README.md">English</a> •
  <b>简体中文</b>
</p>

<p align="center">
  <a href="https://github.com/Dunphil692/antigravity-context-meter/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-emerald.svg?style=flat-square" alt="Version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/平台-macOS%20%7C%20IDE%20%7C%20VS%20Code-purple.svg?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/速度-0.039ms%20%2F%200%20Token-orange.svg?style=flat-square" alt="Speed" />
  <a href="https://github.com/Dunphil692/antigravity-context-meter/stargazers"><img src="https://img.shields.io/github/stars/Dunphil692/antigravity-context-meter?style=flat-square&color=yellow" alt="Stars" /></a>
</p>

<br/>

<!-- Hero Banner -->
<p align="center">
  <img src="assets/hero-banner.jpg" alt="Antigravity Context Meter Showcase" width="100%" style="border-radius: 12px; box-shadow: 0 16px 36px rgba(0,0,0,0.6);" />
</p>

<!-- 实机运行效果图 -->
<p align="center">
  <img src="assets/preview-capsule.png" alt="常态极简胶囊" width="280" />
  <br/><br/>
  <img src="assets/preview-card.png" alt="展开详细卡片" width="420" />
</p>

</div>

---

## 💡 解决的核心痛点

在长时间使用 **Google Antigravity** 进行深度项目开发时，开发者通常面临三大困扰：

1. **上下文超限盲区**：不知道当前会话还能聊多久，直到智能体开始**胡言乱语、遗忘之前的架构决策或回答被截断**；
2. **查用量反向浪费 Token**：在对话框里输入 `/context` 询问用量，反而在占用宝贵的模型 Token 配额；
3. **跨会话迁移困难**：对话满了要开新会话时，手动整理上下文繁琐耗时，极易遗漏关键技术上下文。

**Antigravity Context Meter** 采用 **0 Token 本地静默事件流引擎**，彻底解决了上述问题。

---

## ✨ 核心特性

### 🎨 1. 极简深色磨砂玻璃 UI
- **环形进度仪表**：实时显示百分比与四级健康度告警（健康/轻度消耗/警告/危急）。
- **四色分段条**：清晰区分 **System Rules (系统规则)**、**MCP (工具定义)**、**Messages (聊天记录)** 与 **Outputs (工具大输出)**。
- **macOS 原生硬件加速**：支持物理级硬件渲染与深色毛玻璃模糊。

### ⚡ 2. 0 Token 本地静默追踪 (0.039ms 极速引擎)
- 基于本地事件流监听机制（`fs.watch` + SSE），直接分析本地运行日志。
- **不调用任何模型 API，不向智能体发任何消息，0 消耗 Token**。
- 单次全量分词与统计耗时仅 **0.039 毫秒**，空闲 CPU 占用 **0.0%**。

### 🗂️ 3. 多项目 / 会话自由切换与锁定
- 自动扫描 Antigravity 桌面端与 IDE 端的所有历史和活跃项目。
- 在顶部下拉菜单中一键锁定任意特定会话，或选择 **⚡ 自动跟随最新活动项目**。

<p align="center">
  <img src="assets/preview-sessions.png" alt="多会话下拉切换" width="460" />
</p>

### 🔥 4. Top 5 大开销溯源
- 自动提取消耗 Token 最大的单次文件读写、工具调用或长回复，毫秒级揪出“用量刺客”。

### 🚀 5. 一键 0 遗忘迁移 Prompt 提炼
- 当用量到达 80% 警戒线时，点击 **`⚡ 一键提炼新会话 Prompt`**；
- 算法自动将当前项目的已完成工作、技术选型与未完成任务一键生成精炼的续接 Prompt，无缝开启新会话。

---

## 🖥️ 双模形态

| 形态 | 适用场景 | 技术栈 | 占用体积 |
| :--- | :--- | :--- | :--- |
| **💊 独立桌面悬浮小胶囊** | 全屏开发、多显示器、跨 IDE 监控 | Objective-C Cocoa + WebKit | **仅 53 KB** (原生二进制) |
| **🛠️ IDE 状态栏插件** | 专注编辑器内部开发流程 | VS Code Extension API | **仅 68 KB** (.vsix 安装包) |

---

## 🚀 极速上手

### 方式一：启动独立桌面悬浮小胶囊 (macOS)

```bash
# 1. 克隆本仓库
git clone https://github.com/Dunphil692/antigravity-context-meter.git
cd antigravity-context-meter

# 2. 启动常驻悬浮小胶囊 (在屏幕右上角显示)
./start-capsule.sh

# 3. 如需关闭悬浮窗 (或直接点击卡片上的红叉):
./stop-capsule.sh
```

### 方式二：在 Antigravity IDE / VS Code 中安装插件

1. 前往 [Releases 页面](https://github.com/Dunphil692/antigravity-context-meter/releases/latest) 下载 `antigravity-context-meter-1.0.0.vsix`；
2. 在 IDE 中按下 `Cmd+Shift+X` 打开扩展面板；
3. 点击右上角 `...` 菜单 -> 选择 **`从 VSIX 安装...`** (Install from VSIX)；
4. 底部状态栏即可实时看到环形进度与 Token 实时用量。

---

## 📊 性能压测对比

| 指标 | Antigravity Context Meter | 聊天输入 `/context` | 优势对比 |
| :--- | :---: | :---: | :---: |
| **API Token 消耗** | **0 Token** | 每次消耗 1,000 ~ 5,000 Token | 🟢 **100% 零成本** |
| **刷新延迟** | **0.039 ms** | 1.5 秒 ~ 3.0 秒 | 🟢 **快 50,000 倍** |
| **程序体积** | **53 KB** (原生无依赖) | - | 🟢 **极致轻量** |
| **CPU 占用** | **0.0% ~ 0.1%** | - | 🟢 **零电池损耗** |

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。

<div align="center">
  <sub>Made with ❤️ for the Antigravity Community</sub>
</div>
