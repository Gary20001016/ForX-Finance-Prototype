# 站内信 Markdown 编辑与渲染设计

## 背景

当前站内信正文使用普通多行文本输入，并在 Web 与 App 预览中按纯文本展示。人工模板、系统事件模板和临时消息需要表达分段、强调、列表、链接、引用和代码等结构；如果各入口分别实现，会造成编辑、翻译审核和最终展示不一致。

## 目标

- 人工消息模板、系统事件消息模板和人工任务临时消息共用一个 Markdown 正文编辑器。
- Web 与 App 站内信、模板详情、任务详情、审核预览和最终预览共用一个安全 Markdown 渲染器。
- 多语言翻译与审核保留 Markdown 结构，并允许审核人校对 Markdown 正文。
- App Push 继续使用纯文本，不接入 Markdown。

## 方案选择

考虑过三种方式：

1. **统一 Markdown 组件与安全渲染器（采用）**：所有内容入口共享编辑、预览和渲染规则，一致性最好，后续可独立扩展工具栏。
2. **仅在人工任务临时消息中增加 Markdown（不采用）**：改动小，但模板与临时内容体验不一致，系统事件模板仍无法编辑结构化正文。
3. **引入完整富文本编辑器（不采用）**：所见即所得更直观，但输出格式、机翻保真、变量保护和跨端渲染复杂度明显更高，不符合当前原型范围。

## 统一组件

渲染层使用 `react-markdown`，GFM 扩展使用 `remark-gfm`。`react-markdown` 输出 React 元素而不是直接注入 HTML，并默认不执行原始 HTML；`remark-gfm`补充表格、删除线、任务列表和自动链接等语法。实现不接入 `rehype-raw`，并显式启用 `skipHtml`。参考：[react-markdown 官方仓库](https://github.com/remarkjs/react-markdown)、[remark-gfm 官方仓库](https://github.com/remarkjs/remark-gfm)。

### MarkdownEditor

受控组件接口：

```ts
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  readOnly?: boolean;
}
```

组件提供：

- “编辑 / 分屏预览”模式。
- 工具栏：二级标题、粗体、斜体、无序列表、有序列表、引用、链接、行内代码和代码块。
- 工具栏在当前光标处插入或包裹 Markdown，不直接生成 HTML。
- 字符数和 Markdown 格式提示。
- 只读模式用于多语言源文案对照和查看源码。

### MarkdownContent

受控渲染组件接口：

```ts
interface MarkdownContentProps {
  value: string;
  emptyText?: string;
  compact?: boolean;
}
```

渲染器支持 CommonMark 与 GFM 常用语法：段落、标题、粗体、斜体、删除线、列表、引用、链接、行内代码、代码块、分隔线和表格。

## 接入范围

### 内容编辑

- 人工消息模板：站内信正文改用 `MarkdownEditor`。
- 系统事件模板：与人工模板共用 `TemplateEditorDrawer`，因此使用同一个编辑器。
- 共享模板：使用同一个编辑器。
- 人工任务临时消息：站内信正文改用 `MarkdownEditor`。
- App Push：标题和正文继续使用普通文本输入。

### 多语言

- 机翻源文案继续保存 Markdown 源码。
- 外部翻译任务要求保留 Markdown 标记和 `{{ variable }}` 模板变量，只翻译可见文本。
- 翻译审核页的源正文使用只读 Markdown 源码与渲染结果对照。
- 目标语言正文使用 `MarkdownEditor`，审核人可修改文本和结构。
- 提交审核前校验模板变量集合与源文案一致；现有变量门禁继续生效。

### 预览与只读详情

- `MessagePreview` 的 Web 站内信和 App 站内信正文使用 `MarkdownContent`。
- 模板详情、任务列表详情、审核抽屉、任务最终预览和测试发送预览通过复用 `MessagePreview` 自动获得 Markdown 渲染。
- 已发布模板保持不可编辑；详情页展示渲染效果，并提供可展开的 Markdown 源码查看区域。

## 数据规则

- `LocalizedMessageContent.web.body` 继续为 `string`，存储 Markdown 源码，不新增并行 HTML 字段。
- 草稿、版本、翻译批次、审批快照和发送记录冻结同一份 Markdown 源码。
- 旧纯文本正文仍是合法 Markdown，可直接兼容，无需迁移。
- 不在前端保存渲染后的 HTML，避免不同版本渲染器产生双份真相。

## 安全规则

- 不启用 Markdown 内嵌 HTML 解析；通过 `skipHtml` 忽略 `<script>`、`iframe` 和任意 HTML 标签。
- Markdown 链接只允许 `https://`、`http://` 和 `forxfinance://`；其他协议不生成可点击链接。
- 站内信独立操作按钮仍使用现有跳转白名单校验，不与正文 Markdown 链接混用。
- 链接在新窗口打开时增加 `rel="noopener noreferrer"`。
- 代码块只显示文本，不执行代码。

## 校验与错误处理

- 空正文继续沿用现有必填门禁。
- Markdown 语法不完整时仍保存源码并尽可能预览，不因单个未闭合标记阻止草稿保存。
- 正式提交前阻断危险链接协议和缺失模板变量。
- 渲染异常时退回纯文本正文，并显示“Markdown 预览失败”提示，不影响查看源文案。

## 样式

- 编辑器沿用 Arco Design 的按钮、标签页、文本域和提示样式。
- Web 预览允许标题、表格和代码块完整展示。
- App 站内信预览使用紧凑字号和横向滚动表格，避免撑破手机容器。
- Markdown 内容样式限定在组件作用域内，不影响后台其他页面。

## 测试范围

- 工具栏能正确插入或包裹 Markdown。
- 人工模板、事件模板和临时消息正文均使用统一编辑器。
- Web 和 App 站内信正确渲染标题、强调、列表、链接、引用、代码和表格。
- Push 正文保持纯文本。
- 危险协议和内嵌 HTML 不会形成可执行内容。
- 旧纯文本正文保持正常展示。
- 翻译审核可以修改 Markdown 源码并看到渲染结果。
- 已发布模板只读详情能查看渲染效果和 Markdown 源码。

## 非目标

- 不实现完整所见即所得富文本编辑器。
- 不支持图片上传、附件、公式、流程图或任意 HTML。
- 不改变模板版本、业务审批、发送状态和 App Push 数据结构。
