# ForX Finance 交易所消息中心后台

基于 React、TypeScript、Vite 和 Arco Design 的消息中心管理后台原型。项目依据仓库根目录的后台 PRD 实现，只包含前端页面、模拟数据和本地交互，不连接后端、数据库或真实消息供应商。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm ci
npm run dev -- --port 5174
```

浏览器访问 `http://127.0.0.1:5174/dashboard`。

如 5174 端口已被占用，也可以直接运行 `npm run dev`，然后按终端输出的地址访问。

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
- `/events`：业务事件管理
- `/approvals`：风险分级审核中心
- `/deliveries`：Web 站内信和 App Push 发送记录
- `/analytics`：消息数据分析
- `/settings`：消息分类、保留期、跳转白名单、权限和审计日志
- `/inbox`：用户侧消息中心

## 原型边界

- 页面数据来自 `src/mocks/data.ts`，交互状态由 `src/store/prototypeStore.ts` 管理并保存到浏览器本地存储。
- 外部机翻、APNs/FCM、系统事件和审批流程均为可替换的前端模拟状态，不会调用真实生产接口。
- 所有手机号、邮箱和 UID 均为虚构且经过脱敏展示。
- 页面标记为“演示环境”，不会触发真实生产操作。
