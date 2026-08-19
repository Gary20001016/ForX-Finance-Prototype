import { Tag } from "@arco-design/web-react";
import { getEmailBodyMode } from "../domain/emailChannel";
import type { EmailChannelConfig, EmailMessageContent } from "../domain/types";

export default function EmailPreview({
  content,
  config,
  locale,
}: {
  content: EmailMessageContent;
  config: EmailChannelConfig;
  locale: string;
}) {
  const sender = `${config.fromName} <${config.senderProfileId === "marketing" ? "campaign" : "notice"}@forx.finance>`;
  const bodyMode = getEmailBodyMode(content);
  const htmlAsset = content.htmlAssets?.[locale];

  return (
    <section className="email-message-preview" aria-label="Email 渠道预览">
      <div className="preview-heading">
        <strong>Email 预览</strong>
        <div>
          <Tag color={config.emailType === "营销邮件" ? "magenta" : "blue"}>
            {config.emailType}
          </Tag>
          <Tag color={bodyMode === "html" ? "purple" : "gray"}>
            {bodyMode === "html" ? "HTML 文件" : "纯文本"}
          </Tag>
        </div>
      </div>

      {bodyMode === "text" ? (
        <article className="email-text-preview email-text-preview-active" aria-label="Email 纯文本预览">
          <header>
            <strong>{content.subject || "请输入邮件标题"}</strong>
            <span>{sender}</span>
            <small>{content.preheader || "未填写预览文字"}</small>
          </header>
          <pre>{content.textBody || "请输入邮件纯文本正文"}</pre>
          {config.emailType === "营销邮件" && (
            <small>{content.unsubscribeText || "请配置退订文案"}</small>
          )}
        </article>
      ) : htmlAsset ? (
        <div className="email-html-preview-grid">
          <article className="email-preview-frame desktop" aria-label="Email HTML 桌面预览">
            <header>
              <strong>{content.subject || "请输入邮件标题"}</strong>
              <span>{sender}</span>
              <small>{content.preheader || "未填写预览文字"}</small>
            </header>
            <iframe
              className="email-html-preview-frame"
              title={`${locale} HTML 邮件预览`}
              sandbox=""
              srcDoc={htmlAsset.sanitizedHtml}
            />
          </article>
          <article className="email-preview-frame mobile" aria-label="Email HTML 移动预览">
            <header>
              <strong>{content.subject || "邮件标题"}</strong>
              <span>{config.fromName}</span>
            </header>
            <iframe
              className="email-html-preview-frame mobile"
              title={`${locale} HTML 移动预览`}
              sandbox=""
              srcDoc={htmlAsset.sanitizedHtml}
            />
          </article>
          <article className="email-text-preview" aria-label="Email HTML 兼容性纯文本">
            <strong>兼容性纯文本</strong>
            <pre>{htmlAsset.generatedText || "HTML 中未提取到可见文字"}</pre>
            <small>由系统自动提取，不作为第二套可编辑正文。</small>
          </article>
        </div>
      ) : (
        <div className="email-html-preview-missing">
          尚未上传 {locale} 的 HTML 文件，无法生成该语言预览。
        </div>
      )}
    </section>
  );
}
