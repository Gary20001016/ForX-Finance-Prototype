# 多语言进度翻译结果实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在多语言进度抽屉中直接查看逐语言翻译结果，并允许普通语言当场修订和通过。

**Architecture:** 新建独立结果面板组件负责源文、机翻、当前结果和普通语言编辑；现有进度抽屉只管理展开语言。小语种始终只读并跳转独立审核页。

**Tech Stack:** React、TypeScript、Arco Design React、现有 Prototype Store。

## 用户指定约束

- 本次不新增或运行自动化测试。
- 普通语言可在进度抽屉中修改、保存和通过。
- 小语种只能在“多语言审核”页面修改和审核。

## 实施任务

1. 新建 `src/pages/multilingual/MultilingualResultPanel.tsx`，统一计算源文、机翻和当前结果。
2. 普通语言可处理状态渲染编辑表单，调用 `saveTranslationDraft` 和 `approveOrdinaryTranslation`。
3. 小语种只渲染只读结果和“前往多语言审核”按钮。
4. 修改 `MultilingualProgressDrawer.tsx`，增加单语言展开/收起交互并读取 Store 最新批次。
5. 在 `src/styles/global.css` 增加展开结果布局样式。
6. 同步 `docs/prd/message-center/03-消息模板与多语言.md` 和 `06-审核与发布.md`。
7. 运行 `npm run build` 和 `git diff --check`，不运行测试套件。
8. 提交实现。
