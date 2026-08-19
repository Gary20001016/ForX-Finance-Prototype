import { Button, Tag } from "@arco-design/web-react";
import type { EmailChannelConfig, EmailMessageContent } from "../domain/types";

export default function EmailPreview({
  content,
  config,
}: {
  content: EmailMessageContent;
  config: EmailChannelConfig;
}) {
  const sender = `${config.fromName} <${config.senderProfileId === "marketing" ? "campaign" : "notice"}@forx.finance>`;
  return (
    <section className="email-message-preview" aria-label="Email 渠道预览">
      <div className="preview-heading">
        <strong>Email 预览</strong>
        <Tag color={config.emailType === "营销邮件" ? "magenta" : "blue"}>
          {config.emailType}
        </Tag>
      </div>
      <div className="email-preview-grid">
        <article className="email-preview-frame desktop" aria-label="Email 桌面预览">
          <header>
            <strong>{content.subject || "请输入邮件标题"}</strong>
            <span>{sender}</span>
            <small>{content.preheader || "未填写预览文字"}</small>
          </header>
          <div className="email-preview-body">
            <span className="email-logo">ForX Finance</span>
            <h3>{content.headline || "请输入正文标题"}</h3>
            <p>{content.body || "请输入邮件正文"}</p>
            {content.actionText && (
              <Button type="primary">{content.actionText}</Button>
            )}
            <small>{content.actionUrl || "未配置跳转链接"}</small>
            <footer>
              {content.footerText}
              {config.emailType === "营销邮件" && (
                <span>{content.unsubscribeText || "请配置退订文案"}</span>
              )}
            </footer>
          </div>
        </article>

        <article className="email-preview-frame mobile" aria-label="Email 移动预览">
          <header>
            <strong>{content.subject || "邮件标题"}</strong>
            <span>{config.fromName}</span>
          </header>
          <div className="email-preview-body">
            <span className="email-logo">ForX Finance</span>
            <h3>{content.headline || "正文标题"}</h3>
            <p>{content.body || "邮件正文"}</p>
            {content.actionText && (
              <Button type="primary" long>
                {content.actionText}
              </Button>
            )}
          </div>
        </article>

        <article className="email-text-preview" aria-label="Email 纯文本预览">
          <strong>纯文本预览</strong>
          <pre>{content.textBody || "请输入邮件纯文本正文"}</pre>
        </article>
      </div>
    </section>
  );
}
