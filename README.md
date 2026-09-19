# Claudian — CodeBuddy Provider 版本（Fork）

> 这是 [YishenTu/claudian](https://github.com/YishenTu/claudian) 的一个 Fork，来自未合并的 [PR #772](https://github.com/YishenTu/claudian/pull/772)（作者 [@tzack000](https://github.com/tzack000)），为其添加了 **CodeBuddy（腾讯 CodeBuddy Code CLI）** Provider 支持。
>
> 仅做保存与分发用途，供需要 CodeBuddy 支持的用户使用。所有功劳归于原作者 [Yishen Tu](https://github.com/YishenTu) 与 PR 作者 tzack000。

## 基本信息

| 项目 | 说明 |
|---|---|
| 上游项目 | [YishenTu/claudian](https://github.com/YishenTu/claudian) |
| 代码来源 | tzack000 的 `codebuddy-provider` 分支（PR #772，已被作者关闭未合并） |
| 基于版本 | Claudian v2.0.31（2026-07 前后） |
| 分支最后更新 | 2026-09-01（commit `4e3ed95`） |
| 插件 ID | `realclaudian` |
| 主要新增 | CodeBuddy Provider（通过 ACP 协议驱动 `codebuddy --acp` CLI） |

## 上游原版说明

Claudian 是一个将 AI 编程代理（Claude Code、Codex、Opencode、CodeBuddy Code、Pi 等）嵌入 Obsidian 库的插件。你的库就是代理的工作目录——文件读写、搜索、Bash 命令、多步工作流开箱即用。

**Inline Edit** — 选中文字或从光标处热键触发，直接在笔记内编辑，带词级 diff 预览。

**Slash 命令与 Skills** — 输入 `/` 或 `$` 调用可复用提示词模板或库级/用户级 Skills。

**`@mention`** — 用 `@` 提及库内文件、子代理、MCP 服务器或外部目录文件。

**Plan Mode** — `Shift+Tab` 切换，代理先探索设计、给出方案再动手。

**MCP 服务器** — 通过 Model Context Protocol（stdio、SSE、HTTP）连接外部工具。

**多标签与对话** — 多聊天标签、历史记录、分叉、续聊与压缩。

完整英文说明见上游仓库：https://github.com/YishenTu/claudian

## 本 Fork 新增功能（相比上游 v2.0.31）

- **CodeBuddy Provider**：在 Obsidian 中使用腾讯 CodeBuddy Code CLI 作为 AI 代理
- 通过 ACP（Agent Client Protocol）与 `codebuddy --acp` 通信
- 内置 16 个已知模型（GPT-5.5、Gemini 3.x、GLM-5.2、Kimi-K2.5、DeepSeek-V3.2 等），并与会话自动发现的模型合并
- CodeBuddy 专属设置页：CLI 路径、环境变量、权限模式等
- 默认 bypass permissions（绕过权限确认，分支最后一次提交调整）

## 安装（手动）

1. 自行构建（见下方），或使用 Release 中的产物
2. 将 `main.js`、`styles.css`、`manifest.json` 复制到你的库：
   `<你的库>/.obsidian/plugins/realclaudian/`
3. 重启 Obsidian 并在「第三方插件」中启用 Claudian
4. 在插件设置中选择 CodeBuddy Provider，确认 CLI 路径正确（需已安装并登录 CodeBuddy Code CLI）

## 构建

```bash
npm install
npm run build        # 产物：main.js / styles.css / manifest.json
```

## 注意事项

- 上游主线已迭代至 2.3.x，本 Fork 基于 2.0.31，**不包含**上游后续的双栏会话管理（2.1）、Collab 协作模式（2.2）、云协作（2.3）等新特性
- 上游作者已表示不接受新增 Provider 的 PR，本 Fork 大概率不会合并回主线
- 使用前请确保 CodeBuddy CLI 已安装并完成登录授权

## 社区讨论

- LINUX DO：[Obsidian 里能用 CodeBuddy 的免费模型了，分享下](https://linux.do/t/topic/1776670)

## 致谢

本仓库的存在完全建立在前人的工作之上，感谢：

- **[YishenTu/claudian](https://github.com/YishenTu/claudian)** —— Claudian 本体作者 [@YishenTu](https://github.com/YishenTu)，插件的一切基础都来自他
- **[PR #772](https://github.com/YishenTu/claudian/pull/772) 作者 [@tzack000](https://github.com/tzack000)** —— CodeBuddy Provider 的全部实现出自他的 [codebuddy-provider 分支](https://github.com/tzack000/claudian/tree/codebuddy-provider)，本仓库仅做保存、构建与分发
- 也感谢上游社区中所有为此提过建议和讨论的朋友

本项目遵循 MIT 协议开源，所有功劳归于上述原作者。

## License

[MIT](./LICENSE) © Yishen Tu（上游原作者）及本仓库贡献者。
