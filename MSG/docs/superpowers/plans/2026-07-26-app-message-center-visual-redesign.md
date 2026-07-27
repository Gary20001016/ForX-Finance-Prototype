# App 消息中心视觉重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 App 消息中心调整为纯黑、扁平、荧光绿强调的交易所 App 视觉，同时保留现有交互。

**Architecture:** 仅修改自包含文件 `html/message-center-app.html`。保留现有 JavaScript 数据、分类映射和交互函数，重写设计变量、布局样式与少量页面结构。

**Tech Stack:** HTML5、CSS3、原生 JavaScript。

## Global Constraints

- Web HTML 不修改。
- App HTML 继续支持 `file://` 独立打开。
- 不增加 CDN、字体、图片或 JavaScript 外部依赖。
- 不修改 `categoryToGroup`、消息数据字段或现有交互函数名称。

---

### Task 1: 重构 App 消息中心视觉

**Files:**
- Modify: `html/message-center-app.html`
- Test: `html/message-center-app.html`

**Interfaces:**
- Consumes: 现有 `renderTabs()`、`renderTopics()`、`renderMessages()`、`openDetail()` 和 `markAllRead()`。
- Produces: 纯黑扁平布局、绿色选中态、连续消息行、风险侧边提示和黑色详情面板。

- [ ] **Step 1: 建立结构测试**

检查 HTML 必须继续包含一级分类容器、主题容器、消息列表、详情面板和全部已读按钮：

```bash
node -e "const s=require('fs').readFileSync('html/message-center-app.html','utf8'); for (const id of ['primaryTabs','topics','messageList','detailOverlay','readAllButton']) if (!s.includes('id=\"'+id+'\"')) throw new Error(id)"
```

Expected: 退出码为 0。

- [ ] **Step 2: 重写视觉变量和页面布局**

将背景改为 `#030705`，品牌色改为 `#69f0a0`；取消消息卡片圆角、渐变和阴影；使用 `border-bottom` 分隔消息行；一级分类使用大字号文字，二级主题使用绿色下划线。

- [ ] **Step 3: 调整标题栏、风险提示和底部导航**

标题栏右侧显示“全部已读”；风险消息改为红色侧边线；底部导航改为深黑背景、细线图标和绿色消息选中态。

- [ ] **Step 4: 调整详情面板**

详情面板改为纯黑背景、顶部细分隔线和绿色主要操作，不改变 `openDetail()` 与 `closeDetail()`。

- [ ] **Step 5: 验证脚本、依赖与功能标记**

```bash
node -e "const s=require('fs').readFileSync('html/message-center-app.html','utf8'); const m=s.match(/<script>([\\s\\S]*?)<\\/script>/); if(!m) throw new Error('script'); new Function(m[1]); if(!s.includes('#69f0a0')) throw new Error('green');"
! rg -n '<script[^>]+src=|<link[^>]+href=' html/message-center-app.html
```

Expected: 两条命令退出码均为 0。

