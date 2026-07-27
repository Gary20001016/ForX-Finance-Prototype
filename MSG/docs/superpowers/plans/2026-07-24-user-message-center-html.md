# 用户消息中心 App / Web HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建两个可独立打开、带完整筛选和详情交互的 App 与 Web 消息中心 HTML 原型。

**Architecture:** 两个页面均为自包含 HTML，内联 CSS、演示数据与原生 JavaScript。前端使用五个用户认知分组，JavaScript 映射后台七个消息分类，并通过主题字段完成二级筛选。

**Tech Stack:** HTML5、CSS3、原生 JavaScript，无第三方依赖。

## Global Constraints

- 必须交付 `.html` 文件，不能依赖 React、Vite 或其他构建过程。
- App 与 Web 使用相同的后台分类映射。
- 页面通过 `file://` 直接打开时必须可用。
- 后台分类、前台分组、主题和风险等级必须是相互独立的字段。

---

### Task 1: App 消息中心 HTML

**Files:**
- Create: `html/message-center-app.html`
- Test: `html/message-center-app.html`

**Interfaces:**
- Consumes: 内置 `messages` 数组，字段包括 `category`、`group`、`topic`、`risk` 和 `read`。
- Produces: `renderTabs()`、`renderTopics()`、`renderMessages()`、`openDetail(id)` 和 `markAllRead()`。

- [ ] **Step 1: 创建 App 页面骨架和样式**

实现暗色移动端页面、横向一级分类、二级主题筛选、风险提示区、消息列表和底部详情面板。

- [ ] **Step 2: 添加分类映射和演示数据**

加入七个后台分类到五个前台分组的固定映射，覆盖系统公告、交易、充值提现、安全、强平、活动和奖励消息。

- [ ] **Step 3: 实现原生交互**

一级分类、二级主题、只看未读、全部已读、打开详情和关闭详情必须立即更新页面状态。

- [ ] **Step 4: 验证文件结构**

Run: `rg -n "公告|交易|资产|安全与风控|活动与奖励|openDetail|markAllRead" html/message-center-app.html`

Expected: 所有一级分组和核心交互函数均能匹配。

### Task 2: Web 消息中心 HTML

**Files:**
- Create: `html/message-center-web.html`
- Test: `html/message-center-web.html`

**Interfaces:**
- Consumes: 与 App 页面相同的数据字段和分类映射。
- Produces: 桌面端分组导航、主题筛选、消息列表、概览栏和详情抽屉。

- [ ] **Step 1: 创建 Web 页面骨架和样式**

实现左侧产品导航、中部列表、右侧概览以及点击后出现的详情抽屉。

- [ ] **Step 2: 添加分类映射和演示数据**

使用与 App 页面完全一致的七类到五组映射和主题定义。

- [ ] **Step 3: 实现原生交互**

分类、主题、未读筛选、全部已读和详情抽屉必须可操作，并同步更新未读统计。

- [ ] **Step 4: 验证文件结构**

Run: `rg -n "公告|交易|资产|安全与风控|活动与奖励|openDetail|markAllRead" html/message-center-web.html`

Expected: 所有一级分组和核心交互函数均能匹配。

### Task 3: 独立打开验证

**Files:**
- Test: `html/message-center-app.html`
- Test: `html/message-center-web.html`

**Interfaces:**
- Consumes: 两个完成的 HTML 文件。
- Produces: 不依赖外部资源的可交付原型。

- [ ] **Step 1: 检查 HTML 文档完整性**

Run: `node -e "for (const f of ['html/message-center-app.html','html/message-center-web.html']) { const s=require('fs').readFileSync(f,'utf8'); if (!s.includes('<!DOCTYPE html>') || !s.includes('</html>')) process.exit(1); }"`

Expected: 退出码为 0。

- [ ] **Step 2: 检查无外部依赖**

Run: `! rg -n '<script[^>]+src=|<link[^>]+href=' html/message-center-app.html html/message-center-web.html`

Expected: 退出码为 0。

- [ ] **Step 3: 使用本地静态服务提供访问链接**

Run: `python3 -m http.server 5180 --directory html`

Expected: `message-center-app.html` 和 `message-center-web.html` 均返回 HTTP 200。

