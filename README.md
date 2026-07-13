# NEXUS 交易所消息中心后台

基于 React、TypeScript、Vite 和 Arco Design 的消息中心管理后台原型。项目依据仓库根目录的后台 PRD 实现，只包含前端页面、模拟数据和本地交互，不连接后端、数据库或真实消息供应商。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

默认访问 `http://localhost:5173`。

## 验证

```bash
npm run test:run
npm run build
```

## 主要路由

- `/dashboard`：消息运营工作台
- `/tasks`：消息任务列表
- `/tasks/create`：四步消息任务创建向导
- `/templates`：多语言、多渠道模板
- `/segments`：用户分群
- `/automations`：营销自动化流程
- `/events`：业务事件管理
- `/approvals`：风险分级审核中心
- `/deliveries`：用户消息和渠道发送记录
- `/analytics`：触达与转化分析
- `/channels`：渠道和供应商管理
- `/compliance`：地区、授权、频控与安静时段策略
- `/settings`：分类、链接、敏感词、权限和审计日志

## 原型边界

- 页面数据来自 `src/mocks/data.ts`。
- 表单提交、审批、重试、导出和供应商测试只显示本地反馈。
- 所有手机号、邮箱和 UID 均为虚构且经过脱敏展示。
- `PROD · 只读原型` 标签用于提醒使用者，页面不会触发真实生产操作。
