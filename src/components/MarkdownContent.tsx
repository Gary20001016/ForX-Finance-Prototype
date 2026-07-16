import { Component, type ErrorInfo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const allowedUrlPattern = /^(https?:\/\/|forxfinance:\/\/)/i;

export const transformMarkdownUrl = (url: string) =>
  allowedUrlPattern.test(url.trim()) ? url : "";

class MarkdownRenderBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The plain-text fallback below keeps message content readable.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function MarkdownContent({
  value,
  emptyText = "请输入消息正文",
  compact = false,
}: {
  value: string;
  emptyText?: string;
  compact?: boolean;
}) {
  const source = value || emptyText;
  const fallback = (
    <div className="markdown-render-fallback">
      <span>Markdown 预览失败，已显示纯文本。</span>
      <p>{source}</p>
    </div>
  );

  return (
    <MarkdownRenderBoundary key={source} fallback={fallback}>
      <div className={`markdown-content ${compact ? "compact" : ""}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          urlTransform={transformMarkdownUrl}
          components={{
            a: ({ href, children, ...props }) => (
              <a
                {...props}
                href={href || undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            img: ({ alt }) => (
              <span className="markdown-image-disabled">
                [图片未启用：{alt || "无说明"}]
              </span>
            ),
          }}
        >
          {source}
        </ReactMarkdown>
      </div>
    </MarkdownRenderBoundary>
  );
}
