import { Button, Space, Tag } from "@arco-design/web-react";
import type { Channel, LocalizedMessageContent } from "../domain/types";

export default function MessagePreview({
  content,
  compact = false,
  channels = ["站内信", "Push"],
}: {
  content: LocalizedMessageContent;
  compact?: boolean;
  channels?: Channel[];
}) {
  return (
    <div className={`dual-message-preview ${compact ? "compact" : ""}`}>
      {channels.includes("站内信") && (
        <section className="web-message-preview" aria-label="Web 站内信预览">
          <div className="preview-heading">
            <strong>Web 站内信预览</strong>
            <Tag color="arcoblue">{content.sourceLocale}</Tag>
          </div>
          <div className="preview-device web">
            <span className="preview-brand">ForX Finance · 消息中心</span>
            <h3>{content.web.title || "请输入站内信标题"}</h3>
            <p className="preview-summary">
              {content.web.summary || "请输入消息摘要"}
            </p>
            <p>{content.web.body || "请输入消息正文"}</p>
            {content.web.riskCopy && (
              <div className="preview-risk-copy">{content.web.riskCopy}</div>
            )}
            {content.web.actionText && (
              <Button type="primary" size="small">
                {content.web.actionText}
              </Button>
            )}
            <small>{content.web.targetUrl || "未配置跳转链接"}</small>
          </div>
        </section>
      )}

      {channels.includes("站内信") && (
        <section
          className="app-inbox-message-preview"
          aria-label="App 站内信预览"
        >
          <div className="preview-heading">
            <strong>App 站内信预览</strong>
            <Tag color="cyan">共享内容</Tag>
          </div>
          <div className="preview-device phone app-inbox-phone">
            <div className="phone-status">
              <span>9:41</span>
              <span>5G · 100%</span>
            </div>
            <div className="app-inbox-card">
              <span className="preview-brand">ForX Finance · 消息中心</span>
              <h3>{content.web.title || "请输入站内信标题"}</h3>
              <p className="preview-summary">
                {content.web.summary || "请输入消息摘要"}
              </p>
              <p>{content.web.body || "请输入消息正文"}</p>
              {content.web.riskCopy && (
                <div className="preview-risk-copy">{content.web.riskCopy}</div>
              )}
              {content.web.actionText && (
                <Button type="primary" size="small" long>
                  {content.web.actionText}
                </Button>
              )}
              <small>{content.web.targetUrl || "未配置跳转链接"}</small>
            </div>
          </div>
        </section>
      )}

      {channels.includes("Push") && (
        <section className="push-message-preview" aria-label="App Push 预览">
          <div className="preview-heading">
            <strong>App Push 预览</strong>
            <Space>
              <Tag color="purple">{content.push.platform}</Tag>
              <Tag
                color={content.push.priority === "紧急" ? "red" : "orange"}
              >
                {content.push.priority}
              </Tag>
            </Space>
          </div>
          <div className="preview-device phone">
            <div className="phone-status">
              <span>9:41</span>
              <span>5G · 100%</span>
            </div>
            <div className="push-card">
              <span className="push-app">F · ForX Finance · 现在</span>
              <h3>{content.push.title || "请输入 Push 标题"}</h3>
              <p>{content.push.body || "请输入 Push 正文"}</p>
              {content.push.imageUrl && (
                <div className="push-image">
                  Push 图片 · {content.push.imageUrl}
                </div>
              )}
              <small>{content.push.deepLink || "未配置 Deep Link"}</small>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
