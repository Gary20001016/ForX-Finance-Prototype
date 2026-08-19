import type {
  Channel,
  EmailBodyMode,
  EmailChannelConfig,
  EmailHtmlAsset,
  EmailHtmlValidationIssue,
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
    bodyMode: "text",
    htmlAssets: {},
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

export function getEmailBodyMode(content?: EmailMessageContent): EmailBodyMode {
  return content?.bodyMode === "html" ? "html" : "text";
}

export function getEmailVariableSourceText(content?: EmailMessageContent) {
  if (!content) return "";
  const activeBody =
    getEmailBodyMode(content) === "html"
      ? Object.values(content.htmlAssets || {})
          .map((asset) => asset.sourceHtml)
          .join("\n")
      : [content.textBody, content.unsubscribeText].filter(Boolean).join("\n");
  return [content.subject, content.preheader, activeBody].filter(Boolean).join("\n");
}

const TEMPLATE_VARIABLE_PATTERN = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;

function extractVariables(value: string) {
  return [...value.matchAll(TEMPLATE_VARIABLE_PATTERN)].map((match) => match[1]);
}

function compactHash(value: string) {
  let left = 2166136261;
  let right = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 16777619);
    right = Math.imul(right ^ code, 3266489917);
  }
  return `${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

export function validateEmailHtml(
  html: string,
  {
    emailType,
    declaredVariables,
  }: { emailType: EmailType; declaredVariables: string[] },
): {
  status: "passed" | "blocked";
  issues: EmailHtmlValidationIssue[];
  sanitizedHtml: string;
  generatedText: string;
} {
  const issues: EmailHtmlValidationIssue[] = [];
  const addBlock = (message: string) => issues.push({ level: "阻断", message });

  if (!/<!doctype\s+html/i.test(html)) addBlock("HTML 文件缺少 doctype");
  if (!/<html[\s>]/i.test(html) || !/<head[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) {
    addBlock("HTML 文件必须包含 html、head 和 body 完整结构");
  }
  const blockedTags = [...html.matchAll(/<\s*(script|iframe|form)\b/gi)].map(
    (match) => match[1].toLowerCase(),
  );
  [...new Set(blockedTags)].forEach((tag) => addBlock(`禁止使用 ${tag} 标签`));
  if (/\son[a-z]+\s*=/i.test(html)) addBlock("禁止使用 HTML 事件属性");
  if (/javascript\s*:/i.test(html)) addBlock("禁止使用 JavaScript 链接协议");
  if (/<link\b[^>]*rel\s*=\s*["']?stylesheet/i.test(html)) {
    addBlock("禁止引用外部 CSS");
  }
  if (/<(?:img|a)\b[^>]*(?:src|href)\s*=\s*["']http:\/\//i.test(html)) {
    addBlock("图片和链接必须使用 HTTPS 地址");
  }

  const usedVariables = [...new Set(extractVariables(html))];
  const allowedVariables = new Set([
    ...declaredVariables,
    "unsubscribe_url",
    "preferences_url",
  ]);
  usedVariables
    .filter((name) => !allowedVariables.has(name))
    .forEach((name) => addBlock(`HTML 使用了未登记变量 {{ ${name} }}`));
  if (emailType === "营销邮件" && !usedVariables.includes("unsubscribe_url")) {
    addBlock("营销邮件 HTML 必须包含 {{ unsubscribe_url }}");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  document.querySelectorAll("script, iframe, form").forEach((node) => node.remove());
  document.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (
        attribute.name.toLowerCase().startsWith("on") ||
        /javascript\s*:/i.test(attribute.value)
      ) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  document.querySelectorAll('link[rel="stylesheet" i]').forEach((node) => node.remove());
  const sanitizedHtml = `<!doctype html>\n${document.documentElement.outerHTML}`;
  const generatedText = (document.body.textContent || "").replace(/\s+/g, " ").trim();

  return {
    status: issues.some((item) => item.level === "阻断") ? "blocked" : "passed",
    issues,
    sanitizedHtml,
    generatedText,
  };
}

export function createEmailHtmlAsset({
  locale,
  fileName,
  fileSize,
  html,
  emailType,
  declaredVariables,
  uploadedBy,
  uploadedAt = new Date().toLocaleString("zh-CN", { hour12: false }),
}: {
  locale: string;
  fileName: string;
  fileSize: number;
  html: string;
  emailType: EmailType;
  declaredVariables: string[];
  uploadedBy: string;
  uploadedAt?: string;
}): EmailHtmlAsset {
  const result = validateEmailHtml(html, { emailType, declaredVariables });
  return {
    locale,
    fileName,
    fileSize,
    sourceHtml: html,
    sanitizedHtml: result.sanitizedHtml,
    generatedText: result.generatedText,
    sha256: compactHash(html),
    uploadedBy,
    uploadedAt,
    validationStatus: result.status,
    contentReviewStatus: "pending",
    validationIssues: result.issues,
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
  locales: string[] = [],
): { valid: boolean; errors: string[] } {
  if (!content || !config) {
    return { valid: false, errors: ["邮件内容或发送配置缺失"] };
  }
  const errors: string[] = [];
  if (!content.subject.trim()) errors.push("请填写邮件标题");
  if (getEmailBodyMode(content) === "text") {
    if (!content.textBody.trim()) errors.push("请填写邮件纯文本正文");
  } else {
    locales.forEach((locale) => {
      const asset = content.htmlAssets?.[locale];
      if (!asset) errors.push(`请上传 ${locale} 的 HTML 文件`);
      else if (asset.validationStatus !== "passed") {
        errors.push(`${locale} 的 HTML 文件校验未通过`);
      }
    });
    if (!locales.length && !Object.keys(content.htmlAssets || {}).length) {
      errors.push("请至少上传一个语言的 HTML 文件");
    }
  }
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
