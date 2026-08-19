import type {
  Channel,
  EmailChannelConfig,
  EmailMessageContent,
  EmailType,
} from "./types";

export const ACTIVE_MESSAGE_CHANNELS: Channel[] = ["站内信", "Push", "邮件"];

export const EMAIL_SENDER_PROFILES = [
  { id: "transaction", name: "ForX Finance 通知", address: "notice@forx.finance" },
  { id: "marketing", name: "ForX Finance 活动", address: "campaign@forx.finance" },
] as const;

export function createDefaultEmailContent(
  emailType: EmailType = "事务邮件",
): EmailMessageContent {
  return {
    subject: "",
    preheader: "",
    headline: "",
    body: "",
    textBody: "",
    actionText: "查看详情",
    actionUrl: "https://www.forx.finance/",
    footerText: "本邮件由 ForX Finance 自动发送，请勿直接回复。",
    unsubscribeText:
      emailType === "营销邮件" ? "如果不想继续接收此类邮件，可取消订阅。" : undefined,
  };
}

export function createDefaultEmailConfig(
  emailType: EmailType = "事务邮件",
): EmailChannelConfig {
  return {
    emailType,
    senderProfileId: emailType === "营销邮件" ? "marketing" : "transaction",
    fromName:
      emailType === "营销邮件" ? "ForX Finance 活动" : "ForX Finance 通知",
    replyTo: "support@forx.finance",
    trackingEnabled: true,
    unsubscribeRequired: emailType === "营销邮件",
  };
}

export function validateEmailContent(
  content?: EmailMessageContent,
  config?: EmailChannelConfig,
): { valid: boolean; errors: string[] } {
  if (!content || !config) {
    return { valid: false, errors: ["邮件内容或发送配置缺失"] };
  }
  const errors: string[] = [];
  if (!content.subject.trim()) errors.push("请填写邮件标题");
  if (!content.headline.trim()) errors.push("请填写邮件正文标题");
  if (!content.body.trim()) errors.push("请填写邮件 HTML 正文内容");
  if (!content.textBody.trim()) errors.push("请填写邮件纯文本正文");
  if (!config.senderProfileId || !config.fromName.trim()) {
    errors.push("请选择发件人身份");
  }
  if (
    config.emailType === "营销邮件" &&
    (!config.unsubscribeRequired || !content.unsubscribeText?.trim())
  ) {
    errors.push("营销邮件必须提供退订文案");
  }
  return { valid: errors.length === 0, errors };
}

export function isEmailContentComplete(
  content?: EmailMessageContent,
  config?: EmailChannelConfig,
) {
  return validateEmailContent(content, config).valid;
}

export function channelDisplayName(channel: Channel) {
  return channel === "邮件" ? "Email" : channel;
}
