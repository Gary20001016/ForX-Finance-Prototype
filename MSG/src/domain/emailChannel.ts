import type {
  Channel,
  EmailBodyMode,
  EmailChannelConfig,
  EmailHtmlAsset,
  EmailHtmlValidationIssue,
  EmailMessageContent,
} from "./types";

export const ACTIVE_MESSAGE_CHANNELS: Channel[] = ["站内信", "Push", "邮件"];

export const EMAIL_SENDER_PROFILES = [
  {
    id: "transaction",
    name: "ForX Finance 通知",
    address: "notice@forx.finance",
    stream: "transactional",
    defaultReplyMode: "no_reply",
  },
  {
    id: "security",
    name: "ForX Finance 安全中心",
    address: "security@forx.finance",
    stream: "transactional",
    defaultReplyMode: "no_reply",
  },
  {
    id: "marketing",
    name: "ForX Finance 活动",
    address: "campaign@forx.finance",
    stream: "broadcast",
    defaultReplyMode: "mailbox",
    defaultReplyTo: "support@forx.finance",
  },
  {
    id: "support",
    name: "ForX Finance 客服",
    address: "support@forx.finance",
    stream: "transactional",
    defaultReplyMode: "mailbox",
    defaultReplyTo: "support@forx.finance",
  },
] as const;

export function getEmailSenderProfile(senderProfileId: string) {
  return (
    EMAIL_SENDER_PROFILES.find((item) => item.id === senderProfileId) ||
    EMAIL_SENDER_PROFILES[0]
  );
}

export function createDefaultEmailContent(): EmailMessageContent {
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
    unsubscribeText: undefined,
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
    unsubscribeRequired,
    declaredVariables,
  }: { unsubscribeRequired: boolean; declaredVariables: string[] },
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
  if (unsubscribeRequired && !usedVariables.includes("unsubscribe_url")) {
    addBlock("已开启退订入口，HTML 必须包含 {{ unsubscribe_url }}");
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
  unsubscribeRequired,
  declaredVariables,
  uploadedBy,
  uploadedAt = new Date().toLocaleString("zh-CN", { hour12: false }),
}: {
  locale: string;
  fileName: string;
  fileSize: number;
  html: string;
  unsubscribeRequired: boolean;
  declaredVariables: string[];
  uploadedBy: string;
  uploadedAt?: string;
}): EmailHtmlAsset {
  const result = validateEmailHtml(html, {
    unsubscribeRequired,
    declaredVariables,
  });
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
  senderProfileId = "transaction",
): EmailChannelConfig {
  const sender = getEmailSenderProfile(senderProfileId);
  return {
    senderProfileId: sender.id,
    fromName: sender.name,
    replyMode: sender.defaultReplyMode,
    replyTo: "defaultReplyTo" in sender ? sender.defaultReplyTo : undefined,
    trackingEnabled: true,
    unsubscribeRequired: false,
  };
}

export function normalizeEmailChannelConfig(
  config?: Partial<EmailChannelConfig> & { emailType?: string },
): EmailChannelConfig {
  const sender = getEmailSenderProfile(config?.senderProfileId || "transaction");
  const replyMode =
    config?.replyMode ||
    (config?.replyTo ? "mailbox" : sender.defaultReplyMode);
  return {
    senderProfileId: sender.id,
    fromName: config?.fromName?.trim() || sender.name,
    replyMode,
    replyTo:
      replyMode === "mailbox"
        ? config?.replyTo ||
          ("defaultReplyTo" in sender ? sender.defaultReplyTo : undefined)
        : undefined,
    trackingEnabled: config?.trackingEnabled ?? true,
    unsubscribeRequired:
      config?.unsubscribeRequired ?? config?.emailType === "营销邮件",
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
  if (config.replyMode === "mailbox" && !config.replyTo?.trim()) {
    errors.push("请填写回复邮箱");
  }
  if (config.unsubscribeRequired && !content.unsubscribeText?.trim()) {
    errors.push("已开启退订入口，请填写退订文案");
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
