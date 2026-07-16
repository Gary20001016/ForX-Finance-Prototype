import { useRef, useState } from "react";
import {
  Button,
  Input,
  Radio,
  Space,
  Tag,
} from "@arco-design/web-react";
import MarkdownContent from "./MarkdownContent";

type TextAreaHandle = {
  blur: () => void;
  focus: () => void;
  dom: HTMLTextAreaElement;
};

type EditorMode = "edit" | "split";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  readOnly?: boolean;
}

const toolbarActions = [
  { key: "heading", label: "H2", title: "二级标题" },
  { key: "bold", label: "B", title: "粗体" },
  { key: "italic", label: "I", title: "斜体" },
  { key: "unordered", label: "• 列表", title: "无序列表" },
  { key: "ordered", label: "1. 列表", title: "有序列表" },
  { key: "quote", label: "引用", title: "引用" },
  { key: "link", label: "链接", title: "链接" },
  { key: "inlineCode", label: "代码", title: "行内代码" },
  { key: "codeBlock", label: "代码块", title: "代码块" },
] as const;

type ToolbarAction = (typeof toolbarActions)[number]["key"];

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "使用 Markdown 编写站内信正文",
  minRows = 8,
  readOnly = false,
}: MarkdownEditorProps) {
  const textareaRef = useRef<TextAreaHandle | null>(null);
  const [mode, setMode] = useState<EditorMode>(readOnly ? "split" : "edit");

  const replaceSelection = (
    transform: (selection: string) => string,
    cursorOffset?: number,
  ) => {
    const dom = textareaRef.current?.dom;
    const start = dom?.selectionStart ?? value.length;
    const end = dom?.selectionEnd ?? value.length;
    const selection = value.slice(start, end);
    const replacement = transform(selection);
    const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const nextCursor = start + (cursorOffset ?? replacement.length);
      textareaRef.current?.dom.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const prefixLines = (
    selection: string,
    prefix: string | ((index: number) => string),
    fallback: string,
  ) => {
    const content = selection || fallback;
    return content
      .split("\n")
      .map((line, index) =>
        `${typeof prefix === "function" ? prefix(index) : prefix}${line}`,
      )
      .join("\n");
  };

  const applyAction = (action: ToolbarAction) => {
    if (readOnly) return;
    switch (action) {
      case "heading":
        replaceSelection((selection) => `## ${selection || "小标题"}`);
        break;
      case "bold":
        replaceSelection((selection) => `**${selection || "重点内容"}**`);
        break;
      case "italic":
        replaceSelection((selection) => `_${selection || "强调内容"}_`);
        break;
      case "unordered":
        replaceSelection((selection) =>
          prefixLines(selection, "- ", "列表项"),
        );
        break;
      case "ordered":
        replaceSelection((selection) =>
          prefixLines(selection, (index) => `${index + 1}. `, "列表项"),
        );
        break;
      case "quote":
        replaceSelection((selection) =>
          prefixLines(selection, "> ", "引用内容"),
        );
        break;
      case "link":
        replaceSelection(
          (selection) => `[${selection || "链接文字"}](https://)`,
        );
        break;
      case "inlineCode":
        replaceSelection((selection) => `\`${selection || "code"}\``);
        break;
      case "codeBlock":
        replaceSelection(
          (selection) => `\`\`\`\n${selection || "code"}\n\`\`\``,
        );
        break;
    }
  };

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-header">
        <Space wrap size={4} className="markdown-toolbar">
          {toolbarActions.map((action) => (
            <Button
              key={action.key}
              size="mini"
              type="text"
              title={action.title}
              disabled={readOnly}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyAction(action.key)}
            >
              {action.label}
            </Button>
          ))}
        </Space>
        <Space>
          <Tag>{value.length} 字符</Tag>
          <Radio.Group
            type="button"
            size="mini"
            value={mode}
            onChange={(nextMode) => setMode(nextMode as EditorMode)}
          >
            <Radio value="edit">编辑</Radio>
            <Radio value="split">分屏预览</Radio>
          </Radio.Group>
        </Space>
      </div>
      <div
        className={`markdown-editor-body ${mode === "split" ? "is-split" : ""}`}
      >
        <div className="markdown-editor-input">
          <Input.TextArea
            ref={textareaRef}
            aria-label="Markdown 站内信正文"
            value={value}
            readOnly={readOnly}
            placeholder={placeholder}
            autoSize={{ minRows, maxRows: Math.max(minRows + 8, 16) }}
            onChange={onChange}
          />
        </div>
        {mode === "split" && (
          <div className="markdown-editor-preview">
            <div className="markdown-preview-label">实时预览</div>
            <MarkdownContent value={value} />
          </div>
        )}
      </div>
      <div className="markdown-editor-help">
        支持标题、强调、列表、引用、链接、代码和表格；不支持原始 HTML。
      </div>
    </div>
  );
}
