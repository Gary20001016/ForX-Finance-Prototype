import {
  createDefaultEmailConfig,
  createEmailHtmlAsset,
} from "../domain/emailChannel";
import type {
  ApprovalItem,
  DeliveryRecord,
  LocalizedMessageContent,
  MessageTask,
  MessageTemplate,
  TranslationBatch,
} from "../domain/types";

const manualTemplateId = "TPL-EMAIL-DEMO-HTML";
const eventTemplateId = "TPL-EMAIL-DEMO-EVENT";

const htmlDocument = ({
  lang,
  title,
  greeting,
  introduction,
  amountLabel,
  cta,
  unsubscribe,
}: {
  lang: string;
  title: string;
  greeting: string;
  introduction: string;
  amountLabel: string;
  cta: string;
  unsubscribe: string;
}) => `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f2f3f5;font-family:Arial,sans-serif;color:#1d2129;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f3f5;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 36px;background:#165dff;color:#ffffff;font-size:22px;font-weight:700;">ForX Finance</td></tr>
          <tr><td style="padding:36px;">
            <h1 style="margin:0 0 20px;font-size:28px;line-height:1.35;">${title}</h1>
            <p style="margin:0 0 12px;font-size:16px;line-height:1.7;">${greeting} {{ user_nickname }}，</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">${introduction}</p>
            <div style="margin:0 0 28px;padding:20px;background:#f7f8fa;border-radius:12px;">
              <div style="font-size:13px;color:#86909c;">${amountLabel}</div>
              <div style="margin-top:6px;font-size:26px;font-weight:700;color:#165dff;">{{ amount }} {{ currency }}</div>
            </div>
            <a href="https://www.forx.finance/vip/summer" style="display:inline-block;padding:12px 24px;background:#165dff;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">${cta}</a>
          </td></tr>
          <tr><td style="padding:20px 36px;border-top:1px solid #e5e6eb;color:#86909c;font-size:12px;line-height:1.6;">
            ForX Finance · <a href="{{ unsubscribe_url }}" style="color:#4e5969;">${unsubscribe}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const createHtmlTemplate = (): MessageTemplate => {
  const declaredVariables = ["user_nickname", "amount", "currency"];
  const zhAsset = createEmailHtmlAsset({
    locale: "zh-CN",
    fileName: "vip-summer-zh-CN.html",
    fileSize: 6842,
    html: htmlDocument({
      lang: "zh-CN",
      title: "夏季 VIP 专属礼遇",
      greeting: "尊敬的",
      introduction: "您的夏季 VIP 专属礼遇已开启，限时奖励已经为您准备好。",
      amountLabel: "专属奖励额度",
      cta: "查看我的礼遇",
      unsubscribe: "取消订阅营销邮件",
    }),
    emailType: "营销邮件",
    declaredVariables,
    uploadedBy: "林夏",
    uploadedAt: "2026-08-19 14:20:00",
  });
  const enAsset = createEmailHtmlAsset({
    locale: "en-US",
    fileName: "vip-summer-en-US.html",
    fileSize: 6590,
    html: htmlDocument({
      lang: "en-US",
      title: "Your Summer VIP Exclusive Reward",
      greeting: "Dear",
      introduction: "Your exclusive Summer VIP reward is ready for a limited time.",
      amountLabel: "Exclusive reward",
      cta: "View my VIP reward",
      unsubscribe: "Unsubscribe from marketing emails",
    }),
    emailType: "营销邮件",
    declaredVariables,
    uploadedBy: "林夏",
    uploadedAt: "2026-08-19 14:26:00",
  });
  zhAsset.contentReviewStatus = "approved";
  enAsset.contentReviewStatus = "approved";

  const content: LocalizedMessageContent = {
    sourceLocale: "zh-CN",
    locales: ["zh-CN", "en-US"],
    web: { title: "", summary: "", body: "" },
    push: { title: "", body: "", platform: "全部设备", priority: "普通" },
    email: {
      subject: "{{ user_nickname }}，您的夏季 VIP 专属礼遇已开启",
      preheader: "限时领取 {{ amount }} {{ currency }} 专属奖励",
      bodyMode: "html",
      htmlAssets: { "zh-CN": zhAsset, "en-US": enAsset },
      headline: "",
      body: "",
      textBody: "",
      actionText: "查看我的礼遇",
      actionUrl: "https://www.forx.finance/vip/summer",
      footerText: "ForX Finance VIP 运营团队",
      unsubscribeText: "取消订阅营销邮件",
    },
    emailConfig: createDefaultEmailConfig("营销邮件"),
  };

  return {
    id: manualTemplateId,
    code: "vip_summer_email_demo",
    name: "夏季 VIP 专属礼遇邮件",
    category: "campaign_reward",
    topic: "campaign",
    nature: "营销",
    risk: "低",
    channels: ["邮件"],
    locales: ["zh-CN", "en-US"],
    sourceLocale: "zh-CN",
    translationBatchId: "MT-EMAIL-DEMO-HTML",
    translationReadiness: "已通过",
    version: "v1",
    status: "已发布",
    updatedAt: "08-19 14:40",
    content,
    variables: declaredVariables,
    owner: "VIP 运营",
    usageScope: "manual",
    contentApprovalStatus: "已通过",
    workflowStage: "published",
  };
};

const createEventTemplate = (): MessageTemplate => {
  const body =
    "尊敬的 {{ user_nickname }}，您充值的 {{ amount }} {{ currency }} 已于 {{ occurred_at }} 到账，可在资产记录中查看详情。";
  const content: LocalizedMessageContent = {
    sourceLocale: "zh-CN",
    locales: ["zh-CN", "ja-JP"],
    web: { title: "", summary: "", body: "" },
    push: { title: "", body: "", platform: "全部设备", priority: "普通" },
    email: {
      subject: "充值到账：{{ amount }} {{ currency }}",
      preheader: "您的充值已到账，请查看最新资产记录",
      bodyMode: "text",
      htmlAssets: {},
      headline: "",
      body: "",
      textBody: body,
      actionText: "查看资产记录",
      actionUrl: "https://www.forx.finance/assets/deposit-history",
      footerText: "本邮件由 ForX Finance 资产系统自动发送。",
    },
    emailConfig: createDefaultEmailConfig("事务邮件"),
  };
  return {
    id: eventTemplateId,
    code: "deposit_credited_email_demo",
    eventId: "deposit.credited",
    name: "充值到账 Email 通知",
    category: "asset",
    topic: "deposit",
    nature: "事务",
    risk: "低",
    channels: ["邮件"],
    locales: ["zh-CN", "ja-JP"],
    sourceLocale: "zh-CN",
    translationBatchId: "MT-EMAIL-DEMO-TEXT-PUBLISHED",
    translationReadiness: "已通过",
    version: "v1",
    status: "已发布",
    updatedAt: "08-19 15:10",
    content,
    variables: ["user_nickname", "amount", "currency", "occurred_at"],
    owner: "资产运营",
    usageScope: "event",
    contentApprovalStatus: "已通过",
    workflowStage: "published",
  };
};

const createHtmlTranslationBatch = (
  template: MessageTemplate,
): TranslationBatch => ({
  id: "MT-EMAIL-DEMO-HTML",
  subjectType: "template_version",
  subjectId: template.id,
  subjectName: template.name,
  contentVersion: template.version,
  returnPath: "/templates?scope=manual",
  templateId: template.id,
  templateVersion: template.version,
  productionMode: "machine_translation",
  sourceLocale: "zh-CN",
  targetLocales: ["en-US"],
  status: "已通过",
  createdBy: "林夏",
  createdAt: "08-19 14:21",
  updatedAt: "08-19 14:38",
  channels: ["邮件"],
  sourceContent: {
    title: template.content?.email?.subject,
    summary: template.content?.email?.preheader,
  },
  sourceChannelContent: template.content,
  items: [
    {
      id: "MTI-EMAIL-DEMO-HTML-EN",
      batchId: "MT-EMAIL-DEMO-HTML",
      templateId: template.id,
      templateName: template.name,
      subjectType: "template_version",
      subjectId: template.id,
      subjectName: template.name,
      sourceLocale: "zh-CN",
      targetLocale: "en-US",
      productionMode: "machine_translation",
      externalTaskId: "EXT-EMAIL-DEMO-HTML-EN",
      attemptNo: 1,
      status: "已通过",
      sourceContentHash: "sha256:emaildemohtmlen",
      machineTitle: "{{ user_nickname }}, Your Summer VIP Exclusive Reward Is Here",
      machineSummary: "Claim your exclusive {{ amount }} {{ currency }} reward for a limited time.",
      machineOutput: {
        title: "{{ user_nickname }}, Your Summer VIP Exclusive Reward Is Here",
        summary: "Claim your exclusive {{ amount }} {{ currency }} reward for a limited time.",
      },
      approvedOutput: {
        title: "{{ user_nickname }}, Your Summer VIP Reward Is Ready",
        summary: "Claim your exclusive {{ amount }} {{ currency }} reward for a limited time.",
      },
      machineChannelOutput: {
        email: {
          subject: "{{ user_nickname }}, Your Summer VIP Exclusive Reward Is Here",
          preheader: "Claim your exclusive {{ amount }} {{ currency }} reward for a limited time.",
        },
      },
      approvedChannelOutput: {
        email: {
          subject: "{{ user_nickname }}, Your Summer VIP Reward Is Ready",
          preheader: "Claim your exclusive {{ amount }} {{ currency }} reward for a limited time.",
        },
      },
      submittedAt: "08-19 14:21",
      translatedAt: "08-19 14:24",
      reviewedAt: "08-19 14:38",
      reviewer: "王岚",
      submitter: "林夏",
      variablesValid: true,
    },
  ],
});

const createTextTranslationBatch = (
  template: MessageTemplate,
): TranslationBatch => ({
  id: "MT-EMAIL-DEMO-TEXT",
  subjectType: "template_version",
  subjectId: template.id,
  subjectName: "充值到账 Email 日语审核",
  contentVersion: template.version,
  returnPath: "/templates?scope=event",
  templateId: template.id,
  templateVersion: template.version,
  productionMode: "machine_translation",
  sourceLocale: "zh-CN",
  targetLocales: ["ja-JP"],
  status: "翻译返回待审核",
  createdBy: "资产运营",
  createdAt: "08-19 15:02",
  updatedAt: "08-19 15:10",
  channels: ["邮件"],
  sourceContent: {
    title: template.content?.email?.subject,
    summary: template.content?.email?.preheader,
    body: template.content?.email?.textBody,
  },
  sourceChannelContent: template.content,
  items: [
    {
      id: "MTI-EMAIL-DEMO-TEXT-JA",
      batchId: "MT-EMAIL-DEMO-TEXT",
      templateId: template.id,
      templateName: template.name,
      subjectType: "template_version",
      subjectId: template.id,
      subjectName: "充值到账 Email 日语审核",
      sourceLocale: "zh-CN",
      targetLocale: "ja-JP",
      productionMode: "machine_translation",
      externalTaskId: "EXT-EMAIL-DEMO-TEXT-JA",
      attemptNo: 1,
      status: "翻译返回待审核",
      sourceContentHash: "sha256:emaildemotextja",
      machineTitle: "入金反映：{{ amount }} {{ currency }}",
      machineSummary: "入金が反映されました。最新の資産履歴をご確認ください。",
      machineBody:
        "{{ user_nickname }} 様、{{ amount }} {{ currency }} の入金が {{ occurred_at }} に反映されました。資産履歴で詳細をご確認いただけます。",
      machineOutput: {
        title: "入金反映：{{ amount }} {{ currency }}",
        summary: "入金が反映されました。最新の資産履歴をご確認ください。",
        body: "{{ user_nickname }} 様、{{ amount }} {{ currency }} の入金が {{ occurred_at }} に反映されました。資産履歴で詳細をご確認いただけます。",
      },
      humanDraft: {
        title: "入金反映のお知らせ：{{ amount }} {{ currency }}",
        summary: "入金が反映されました。資産履歴をご確認ください。",
        body: "{{ user_nickname }} 様、{{ amount }} {{ currency }} の入金が {{ occurred_at }} に反映されました。資産履歴から詳細をご確認ください。",
      },
      machineChannelOutput: {
        email: {
          subject: "入金反映：{{ amount }} {{ currency }}",
          preheader: "入金が反映されました。最新の資産履歴をご確認ください。",
          textBody:
            "{{ user_nickname }} 様、{{ amount }} {{ currency }} の入金が {{ occurred_at }} に反映されました。資産履歴で詳細をご確認いただけます。",
        },
      },
      humanChannelDraft: {
        email: {
          subject: "入金反映のお知らせ：{{ amount }} {{ currency }}",
          preheader: "入金が反映されました。資産履歴をご確認ください。",
          textBody:
            "{{ user_nickname }} 様、{{ amount }} {{ currency }} の入金が {{ occurred_at }} に反映されました。資産履歴から詳細をご確認ください。",
        },
      },
      submittedAt: "08-19 15:02",
      translatedAt: "08-19 15:10",
      submitter: "资产运营",
      variablesValid: true,
      specialReviewRequired: true,
      authorizedReviewerIds: ["admin-01", "reviewer-ja-01"],
      assigneeId: "admin-01",
      assignee: "Gary Ma",
    },
  ],
});

const createPublishedTextTranslationBatch = (
  template: MessageTemplate,
): TranslationBatch => {
  const reviewBatch = createTextTranslationBatch(template);
  return {
    ...reviewBatch,
    id: "MT-EMAIL-DEMO-TEXT-PUBLISHED",
    subjectName: template.name,
    contentVersion: template.version,
    status: "已通过",
    createdAt: "08-18 11:02",
    updatedAt: "08-18 11:28",
    items: reviewBatch.items.map((item) => ({
      ...item,
      id: "MTI-EMAIL-DEMO-TEXT-JA-PUBLISHED",
      batchId: "MT-EMAIL-DEMO-TEXT-PUBLISHED",
      subjectName: template.name,
      status: "已通过",
      approvedOutput: item.humanDraft,
      approvedChannelOutput: item.humanChannelDraft,
      reviewedAt: "08-18 11:28",
      reviewer: "松本遥",
      assigneeId: "reviewer-ja-01",
      assignee: "松本遥",
    })),
  };
};

export function createEmailDemoFixtures(): {
  templates: MessageTemplate[];
  tasks: MessageTask[];
  translationBatches: TranslationBatch[];
  approvals: ApprovalItem[];
  deliveries: DeliveryRecord[];
} {
  const htmlTemplate = createHtmlTemplate();
  const eventTemplate = createEventTemplate();
  const manualTask: MessageTask = {
    id: "MSG-EMAIL-DEMO-MANUAL",
    name: "VIP 礼遇 Email 群发",
    type: "定时群发",
    category: "campaign_reward",
    topic: "campaign",
    nature: "营销",
    risk: "低",
    template: `${htmlTemplate.code} ${htmlTemplate.version}`,
    channels: ["邮件"],
    audience: "VIP 3-9 活跃用户",
    audienceCount: 28600,
    schedule: "08-20 20:00 UTC+8",
    status: "待审核",
    approval: "一级审核中",
    approvalStatus: "审核中",
    deliveryResult: "未开始",
    progress: 0,
    successRate: 0,
    creator: "林夏",
    team: "VIP 运营",
    contentMode: "template",
    content: htmlTemplate.content,
    expiresAt: "2026-08-23 20:00",
    retentionDays: 180,
    audienceType: "vip",
    sampleUsers: ["UID 82***19 · zh-CN · Email", "UID 51***02 · en-US · Email"],
    translationBatchId: htmlTemplate.translationBatchId,
    createdAt: "08-19 14:45",
    triggerType: "manual",
    templateId: htmlTemplate.id,
    templateVersion: htmlTemplate.version,
    contentApprovalStatus: "待审核",
    contentApprovalId: "APR-EMAIL-DEMO-CONTENT",
    workflowStage: "content_review",
  };
  const eventTask: MessageTask = {
    id: "MSG-EMAIL-DEMO-EVENT",
    name: "充值到账 Email 事件任务",
    type: "事件触发",
    category: "asset",
    topic: "deposit",
    nature: "事务",
    risk: "低",
    template: `${eventTemplate.code} ${eventTemplate.version}`,
    channels: ["邮件"],
    audience: "事件主体用户",
    audienceCount: 1,
    schedule: "事件到达时",
    status: "已启用",
    approval: "内容与多语言已通过",
    progress: 0,
    successRate: 99.98,
    creator: "系统事件",
    team: "资产运营",
    contentMode: "template",
    content: eventTemplate.content,
    expiresAt: "事件发生后 7 天",
    retentionDays: 365,
    sampleUsers: ["UID 18***87 · ja-JP · Email"],
    translationBatchId: eventTemplate.translationBatchId,
    createdAt: "08-19 15:12",
    triggerType: "event",
    templateId: eventTemplate.id,
    templateVersion: eventTemplate.version,
    eventConfig: {
      eventId: "deposit.credited",
      eventVersion: "1.0.0",
      conditionExpression: "事件到达即触发",
      variableMappings: ["user_nickname", "amount", "currency", "occurred_at"].map(
        (variable) => ({
          eventField: variable,
          templateVariable: variable,
          required: true,
        }),
      ),
      dedupeKey: "{{ event_id }}:{{ user_id }}",
      eventTtlSeconds: 300,
      maxRetries: 3,
      retryBackoffSeconds: 30,
    },
    contentApprovalStatus: "已通过",
    workflowStage: "published",
  };
  const approval: ApprovalItem = {
    id: "APR-EMAIL-DEMO-CONTENT",
    objectType: "消息任务",
    name: "Email 营销内容审核",
    version: "v1",
    risk: "低",
    nature: "营销",
    category: "campaign_reward",
    topic: "campaign",
    sourceType: "人工消息",
    audience: manualTask.audienceCount,
    cost: "Email 预计 ¥1,144",
    schedule: manualTask.schedule,
    step: "内容审核",
    submitter: "林夏",
    submitterId: "ops-22",
    assignee: "Gary Ma",
    assigneeId: "admin-01",
    submittedAt: "08-19 14:48",
    status: "待审核",
    taskId: manualTask.id,
    templateId: htmlTemplate.id,
    channels: ["邮件"],
    locales: htmlTemplate.locales,
    content: htmlTemplate.content,
    sampleUsers: manualTask.sampleUsers,
    expiresAt: manualTask.expiresAt,
    changes: [
      "新增 zh-CN 与 en-US 两份 HTML 完成稿",
      "标题和预览文字已通过外部机翻与语言审核",
      "HTML 安全、变量与退订链接检查通过",
    ],
    triggerType: "manual",
    templateVersion: htmlTemplate.version,
  };
  const openedDelivery: DeliveryRecord = {
    id: "DEL-EMAIL-DEMO-OPENED",
    task: manualTask.name,
    user: "UID 82***19",
    destination: "ga***@example.com",
    channel: "邮件",
    provider: "Amazon SES",
    status: "已打开",
    submittedAt: "18:20:01.102",
    deliveredAt: "18:20:01.684",
    retryCount: 0,
    cost: "¥0.004",
    category: "campaign_reward",
    topic: "campaign",
    source: "人工消息",
    risk: "低",
    locale: "zh-CN",
    devicePlatform: "Web",
    providerMessageId: "SES-EMAIL-DEMO-OPENED",
    recipientEmailMasked: "ga***@example.com",
    messageStream: "broadcast",
    openedAt: "18:22:14.286",
    providerEventId: "SES-EVT-EMAIL-DEMO-001",
  };
  const bouncedDelivery: DeliveryRecord = {
    id: "DEL-EMAIL-DEMO-BOUNCED",
    task: eventTask.name,
    user: "UID 18***87",
    destination: "ri***@example.jp",
    channel: "邮件",
    provider: "Amazon SES",
    status: "已退信",
    submittedAt: "18:24:31.028",
    deliveredAt: "—",
    error: "MAILBOX_NOT_FOUND · 收件邮箱不存在",
    retryCount: 0,
    cost: "¥0.004",
    eventCode: "deposit.credited",
    category: "asset",
    topic: "deposit",
    source: "系统事件",
    risk: "低",
    locale: "ja-JP",
    devicePlatform: "Web",
    providerMessageId: "SES-EMAIL-DEMO-BOUNCED",
    errorCode: "MAILBOX_NOT_FOUND",
    retryable: false,
    recipientEmailMasked: "ri***@example.jp",
    messageStream: "transactional",
    bounceType: "hard",
    bounceReason: "收件邮箱不存在",
    providerEventId: "SES-EVT-EMAIL-DEMO-002",
  };

  return {
    templates: [htmlTemplate, eventTemplate],
    tasks: [manualTask, eventTask],
    translationBatches: [
      createHtmlTranslationBatch(htmlTemplate),
      createPublishedTextTranslationBatch(eventTemplate),
      createTextTranslationBatch(eventTemplate),
    ],
    approvals: [approval],
    deliveries: [openedDelivery, bouncedDelivery],
  };
}
