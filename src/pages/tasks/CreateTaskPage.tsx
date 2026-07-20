import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
  Radio,
  Select,
  Space,
  Steps,
  Tag,
} from "@arco-design/web-react";
import {
  IconArrowLeft,
  IconCheck,
  IconSave,
} from "@arco-design/web-react/icon";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import MessagePreview from "../../components/MessagePreview";
import MarkdownEditor from "../../components/MarkdownEditor";
import { hasUnsafeMarkdownLinks } from "../../components/MarkdownContent";
import TranslationWorkflowPanel from "../templates/TranslationWorkflowPanel";
import type {
  Channel,
  EventTriggerConfig,
  LocalizedMessageContent,
  MessageTask,
  RiskLevel,
  TaskTriggerType,
} from "../../domain/types";
import { canEditManualTask, isManualTaskStatus } from "./taskLifecycle";
import {
  createTranslationBatch,
  prepareSingleLanguageContent,
  requiresSpecialLanguageReview,
  saveTemplate,
  saveTaskDraft,
  submitTask,
  usePrototypeStore,
  validateActionUrl,
  validateEventTaskConfig,
} from "../../store/prototypeStore";
import TaskSummary from "./TaskSummary";
import EventTriggerFields, {
  createDefaultEventConfig,
} from "./EventTriggerFields";
import UidAudienceImporter, {
  createEmptyUidAudienceValue,
  type UidAudienceValue,
} from "./UidAudienceImporter";
import {
  maskUid,
  mergeUidAudience,
  parseManualUids,
} from "./uidAudience";
import {
  isReusableMessageTemplate,
  templateSupportsScope,
} from "../templates/templateScope";
import { getMessageCategoryDefaultNature } from "../../domain/messageCategoryPolicy";
import {
  sameChannels,
  templateCoversChannels,
} from "./taskChannelPolicy";

const FormItem = Form.Item;
const supportedLocales = [
  "zh-CN",
  "en-US",
  "zh-TW",
  "ja-JP",
  "ko-KR",
  "es-ES",
  "tr-TR",
  "ru-RU",
  "fr-FR",
  "de-DE",
];
const sameLocales = (left: string[], right: string[]) =>
  left.length === right.length && left.every((locale) => right.includes(locale));
const emptyContent: LocalizedMessageContent = {
  sourceLocale: "zh-CN",
  locales: ["zh-CN"],
  web: {
    title: "",
    summary: "",
    body: "",
    actionText: "查看详情",
    targetUrl: "forxfinance://security/devices",
  },
  push: {
    title: "",
    body: "",
    deepLink: "forxfinance://security/devices",
    platform: "全部设备",
    priority: "普通",
  },
};
const audienceMap: Record<
  string,
  { label: string; count: number; samples: string[] }
> = {
  all: {
    label: "全部有效用户",
    count: 4_280_000,
    samples: [
      "UID 82***19 · zh-CN · iOS",
      "UID 51***02 · en-US · Android",
      "UID 18***87 · zh-CN · Web",
    ],
  },
  uid: {
    label: "指定 UID 名单",
    count: 3,
    samples: [
      "UID 100***01 · zh-CN · iOS",
      "UID 100***02 · en-US · Android",
      "UID 100***03 · zh-TW · Web",
    ],
  },
  vip: {
    label: "指定 VIP",
    count: 86_300,
    samples: [
      "UID 20***64 · VIP 7 · iOS",
      "UID 19***32 · VIP 4 · Android",
      "UID 46***08 · VIP 2 · Web",
    ],
  },
  agent: {
    label: "指定代理",
    count: 18_420,
    samples: [
      "UID 72***01 · AGT-1008 · iOS",
      "UID 33***29 · AGT-1008 · Android",
      "UID 93***46 · AGT-1012 · Web",
    ],
  },
  campaign: {
    label: "活动参与用户",
    count: 328_400,
    samples: [
      "UID 93***46 · 已报名 · Android",
      "UID 72***01 · 已完成 · iOS",
      "UID 33***29 · 已报名 · Web",
    ],
  },
};

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const store = usePrototypeStore();
  const routeState = location.state as {
    copyTask?: MessageTask;
    resume?: boolean;
    eventId?: string;
  } | null;
  const copiedTask = routeState?.copyTask;
  const editingTask = Boolean(
    routeState?.resume &&
      copiedTask &&
      (copiedTask.triggerType === "event" ||
        (isManualTaskStatus(copiedTask.status) &&
          canEditManualTask(copiedTask.status))),
  );
  const manualTemplates = store.templates.filter(
    (template) =>
      isReusableMessageTemplate(template) &&
      template.translationReadiness === "已通过" &&
      templateSupportsScope(template, "manual"),
  );
  const eventTemplates = store.templates.filter(
    (template) =>
      template.translationReadiness === "已通过" &&
      template.status === "已发布" &&
      templateSupportsScope(template, "event"),
  );
  const initialEvent = store.events.find(
    (event) =>
      event.id === (copiedTask?.eventConfig?.eventId || routeState?.eventId),
  );
  const initialTriggerType: TaskTriggerType =
    copiedTask?.triggerType || (routeState?.eventId ? "event" : "manual");
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [triggerType, setTriggerType] =
    useState<TaskTriggerType>(initialTriggerType);
  const [contentMode, setContentMode] = useState<"template" | "temporary">(
    initialTriggerType === "event"
      ? "template"
      : copiedTask?.contentMode || "template",
  );
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(() => {
    const supportedChannels = copiedTask?.channels.filter(
      (channel) => channel === "站内信" || channel === "Push",
    );
    return supportedChannels?.length
      ? supportedChannels
      : ["站内信", "Push"];
  });
  const approvedTemplates = manualTemplates.filter((template) =>
    templateCoversChannels(template.channels, selectedChannels),
  );
  const [templateId, setTemplateId] = useState<string | undefined>(
    copiedTask?.templateId ||
      store.templates.find(
        (template) =>
          template.name === copiedTask?.template ||
          `${template.code} ${template.version}` === copiedTask?.template,
      )?.id ||
      (initialTriggerType === "event"
        ? eventTemplates[0]?.id
        : approvedTemplates[0]?.id),
  );
  const [eventId, setEventId] = useState(
    copiedTask?.eventConfig?.eventId || routeState?.eventId || initialEvent?.id,
  );
  const [eventConfig, setEventConfig] = useState<
    EventTriggerConfig | undefined
  >(
    () =>
      copiedTask?.eventConfig ||
      (initialEvent
        ? createDefaultEventConfig(
            initialEvent,
            eventTemplates.find(
              (item) =>
                item.id === (copiedTask?.templateId || eventTemplates[0]?.id),
            ),
          )
        : undefined),
  );
  const [temporary, setTemporary] = useState<LocalizedMessageContent>(
    copiedTask?.content || emptyContent,
  );
  const [temporarySourceLocale, setTemporarySourceLocale] = useState(
    copiedTask?.content?.sourceLocale || "zh-CN",
  );
  const [targetLocales, setTargetLocales] = useState<string[]>(
    copiedTask?.content?.locales.filter(
      (locale) => locale !== (copiedTask.content?.sourceLocale || "zh-CN"),
    ) || [],
  );
  const [temporaryBatchId, setTemporaryBatchId] = useState<string | undefined>(
    copiedTask?.translationBatchId,
  );
  const [temporaryBatchChannels, setTemporaryBatchChannels] = useState<
    Channel[]
  >(copiedTask?.translationBatchId ? [...selectedChannels] : []);
  const [audienceType, setAudienceType] = useState(
    copiedTask?.audienceType || "all",
  );
  const [uidAudienceValue, setUidAudienceValue] = useState<UidAudienceValue>(
    () => {
      const saved = copiedTask?.uidAudience;
      return saved
        ? {
            manualText: saved.manualUids.join("\n"),
            csvFileName: saved.csvFileName,
            csvTotalRows: saved.csvTotalRows,
            csvValidUids: saved.csvValidUids,
            csvInvalidRows: saved.csvInvalidRows,
            duplicateCount: saved.duplicateCount,
            csvConfirmed: saved.csvConfirmed,
          }
        : createEmptyUidAudienceValue("100001\n100002\n100003");
    },
  );
  const [snapshot, setSnapshot] = useState<Record<string, unknown>>({});
  const [categoryChanged, setCategoryChanged] = useState(false);
  const selectedTemplate =
    (triggerType === "event"
      ? eventTemplates.find((template) => template.id === templateId)
      : approvedTemplates.find((template) => template.id === templateId)) ||
    (triggerType === "event" ? eventTemplates[0] : approvedTemplates[0]);
  const currentBatch = temporaryBatchId
    ? store.translationBatches.find((batch) => batch.id === temporaryBatchId)
    : undefined;
  const temporaryTranslationTemplate = currentBatch
    ? store.templates.find(
        (template) => template.id === currentBatch.templateId,
      )
    : undefined;
  const content =
    contentMode === "template"
      ? selectedTemplate?.content || emptyContent
      : {
          ...temporary,
          sourceLocale: temporarySourceLocale,
          locales: [temporarySourceLocale, ...targetLocales],
        };
  const manualUids = useMemo(
    () => parseManualUids(uidAudienceValue.manualText),
    [uidAudienceValue.manualText],
  );
  const mergedUidAudience = useMemo(
    () =>
      mergeUidAudience(
        manualUids,
        uidAudienceValue.csvValidUids,
        uidAudienceValue.csvConfirmed,
      ),
    [
      manualUids,
      uidAudienceValue.csvConfirmed,
      uidAudienceValue.csvValidUids,
    ],
  );
  const specifiedUidAudience = useMemo(
    () => ({
      label: "指定 UID 名单",
      count: mergedUidAudience.finalUids.length,
      samples: mergedUidAudience.finalUids
        .slice(0, 3)
        .map((uid) => `UID ${maskUid(uid)}`),
    }),
    [mergedUidAudience.finalUids],
  );
  const audience =
    triggerType === "event"
      ? {
          label: "事件主体用户",
          count: 1,
          samples: ["UID TEST-001 · 由事件 user_id 确定"],
        }
      : audienceType === "uid"
        ? specifiedUidAudience
        : audienceMap[audienceType];
  const translationScopeCurrent =
    !temporaryBatchId ||
    (sameChannels(temporaryBatchChannels, selectedChannels) &&
      currentBatch?.sourceLocale === temporarySourceLocale &&
      sameLocales(currentBatch.targetLocales, targetLocales));
  const directReviewRequired =
    targetLocales.length === 0 &&
    requiresSpecialLanguageReview(temporarySourceLocale);
  const translationReady =
    contentMode === "template"
      ? selectedTemplate?.translationReadiness === "已通过"
      : directReviewRequired
        ? currentBatch?.productionMode === "direct_source_review" &&
          currentBatch.status === "已通过" &&
          translationScopeCurrent
        : targetLocales.length === 0 ||
          (currentBatch?.status === "已通过" && translationScopeCurrent);
  const temporaryLanguageAction = targetLocales.length
    ? temporaryBatchId && !translationScopeCurrent
      ? "按当前配置重新创建机翻任务"
      : "创建外部机翻任务"
    : directReviewRequired
      ? "提交语言审核"
      : "完成语言准备";
  const values = { ...snapshot, ...form.getFieldsValue() };
  const selectedCategory = String(
    values.category || copiedTask?.category || "系统公告",
  );
  const resolvedNature =
    editingTask &&
    copiedTask &&
    !categoryChanged &&
    selectedCategory === copiedTask.category
      ? copiedTask.nature
      : getMessageCategoryDefaultNature(store.categories, selectedCategory) ||
        "事务";
  const channels = selectedChannels;
  const temporaryWebComplete = Boolean(
    temporary.web.title && temporary.web.summary && temporary.web.body,
  );
  const temporaryPushComplete = Boolean(
    temporary.push.title && temporary.push.body,
  );
  const temporaryContentComplete =
    (!channels.includes("站内信") || temporaryWebComplete) &&
    (!channels.includes("Push") || temporaryPushComplete);
  const schedule =
    triggerType === "event"
      ? "事件到达时"
      : values.scheduleMode === "now"
        ? "立即"
        : values.scheduledAt
          ? `${String(values.scheduledAt)} ${values.timezone || ""}`.trim()
          : "指定时间待填写";
  const expiresAt = values.expireAt
    ? String(values.expireAt)
    : editingTask && copiedTask?.expiresAt
      ? copiedTask.expiresAt
      : "发送后 24 小时";
  const updateSnapshot = (changedValues?: Record<string, unknown>) => {
    if (
      changedValues &&
      Object.prototype.hasOwnProperty.call(changedValues, "category")
    ) {
      setCategoryChanged(true);
    }
    if (changedValues?.scheduleMode === "now") {
      form.setFieldsValue({ scheduledAt: undefined, timezone: undefined });
    }
    if (
      changedValues?.scheduleMode === "scheduled" &&
      !form.getFieldValue("timezone")
    ) {
      form.setFieldsValue({ timezone: "Asia/Shanghai" });
    }
    setSnapshot({
      ...snapshot,
      ...form.getFieldsValue(),
      ...(changedValues?.scheduleMode === "now"
        ? { scheduledAt: undefined, timezone: undefined }
        : {}),
    });
  };
  const updateChannels = (nextChannels: Channel[]) => {
    setSelectedChannels(nextChannels);
    const currentTemplate = manualTemplates.find(
      (template) => template.id === templateId,
    );
    if (
      !currentTemplate ||
      !templateCoversChannels(currentTemplate.channels, nextChannels)
    ) {
      setTemplateId(
        manualTemplates.find((template) =>
          templateCoversChannels(template.channels, nextChannels),
        )?.id,
      );
    }
  };
  const patchWeb = (changes: Partial<LocalizedMessageContent["web"]>) =>
    setTemporary((value) => ({ ...value, web: { ...value.web, ...changes } }));
  const patchPush = (changes: Partial<LocalizedMessageContent["push"]>) =>
    setTemporary((value) => ({
      ...value,
      push: { ...value.push, ...changes },
    }));
  const updateTemporarySourceLocale = (sourceLocale: string) => {
    setTemporarySourceLocale(sourceLocale);
    setTargetLocales((locales) => locales.filter((locale) => locale !== sourceLocale));
    setTemporary((value) => ({
      ...value,
      sourceLocale,
      locales: [sourceLocale],
    }));
  };
  const eventValidation = validateEventTaskConfig(
    eventConfig,
    store.events.find((item) => item.id === eventId),
    selectedTemplate,
  );
  const next = async () => {
    if (current === 0) {
      try {
        await form.validate(["name", "business", "category"]);
      } catch {
        return;
      }
      if (!channels.length) {
        Message.warning("请至少选择站内信或 App Push");
        return;
      }
      if (triggerType === "event" && !eventValidation.valid) {
        Message.warning(eventValidation.reason || "请完整配置系统事件触发策略");
        return;
      }
      if (contentMode === "template" && !selectedTemplate) {
        Message.warning("当前渠道没有可用的审核通过模板，请调整渠道或改用临时消息");
        return;
      }
      if (contentMode === "temporary" && !temporaryContentComplete) {
        Message.warning("请完整填写所选发送渠道的消息内容");
        return;
      }
    }
    if (current === 1 && triggerType === "manual" && audienceType === "uid") {
      if (uidAudienceValue.csvFileName && !uidAudienceValue.csvConfirmed) {
        Message.warning("请先确认 UID CSV 导入结果");
        return;
      }
      if (!mergedUidAudience.finalUids.length) {
        Message.warning("请至少输入或导入一个有效 UID");
        return;
      }
    }
    if (
      current === 2 &&
      triggerType === "manual" &&
      form.getFieldValue("scheduleMode") === "scheduled" &&
      (!form.getFieldValue("scheduledAt") || !form.getFieldValue("timezone"))
    ) {
      Message.warning("请选择计划发送时间和任务时区");
      return;
    }
    updateSnapshot();
    setCurrent((value) => Math.min(value + 1, 3));
  };
  const submission = () => ({
    name: (form.getFieldValue("name") || "未命名任务") as string,
    category: (form.getFieldValue("category") || "系统公告") as string,
    nature: resolvedNature,
    risk: (form.getFieldValue("risk") || "低") as RiskLevel,
    triggerType,
    contentMode,
    template:
      contentMode === "template"
        ? selectedTemplate?.name || "未选择模板"
        : "临时消息",
    templateId: contentMode === "template" ? selectedTemplate?.id : undefined,
    templateVersion:
      contentMode === "template" ? selectedTemplate?.version : undefined,
    eventConfig: triggerType === "event" ? eventConfig : undefined,
    channels,
    audience: audience.label,
    audienceCount: audience.count,
    schedule,
    creator: "Gary Ma",
    team: (form.getFieldValue("business") || "消息运营") as string,
    content,
    expiresAt,
    retentionDays: 365,
    audienceType:
      triggerType === "event"
        ? undefined
        : (audienceType as "all" | "uid" | "vip" | "agent" | "campaign"),
    sampleUsers: audience.samples,
    uidAudience:
      triggerType === "manual" && audienceType === "uid"
        ? {
            manualUids,
            csvFileName: uidAudienceValue.csvFileName,
            csvTotalRows: uidAudienceValue.csvTotalRows,
            csvValidUids: uidAudienceValue.csvValidUids,
            csvInvalidRows: uidAudienceValue.csvInvalidRows,
            duplicateCount: uidAudienceValue.duplicateCount,
            csvConfirmed: uidAudienceValue.csvConfirmed,
            finalUids: mergedUidAudience.finalUids,
          }
        : undefined,
    translationBatchId:
      contentMode === "template"
        ? selectedTemplate?.translationBatchId
        : temporaryBatchId,
  });
  const saveDraft = () => {
    try {
      saveTaskDraft(submission(), editingTask ? copiedTask?.id : undefined);
      Message.success(
        editingTask
          ? "任务已重新保存为草稿，旧审批已撤回"
          : "任务草稿已保存，并已出现在任务列表",
      );
    } catch {
      Message.error("草稿保存失败");
    }
  };
  const submit = () => {
    if (!channels.length) {
      Message.warning("请至少选择站内信或 App Push");
      return;
    }
    if (contentMode === "template" && !selectedTemplate) {
      Message.warning("当前渠道没有可用的审核通过模板，请调整渠道或改用临时消息");
      return;
    }
    if (contentMode === "temporary" && !temporaryContentComplete) {
      Message.warning("请完整填写所选发送渠道的消息内容");
      return;
    }
    if (triggerType === "manual" && audienceType === "uid") {
      if (uidAudienceValue.csvFileName && !uidAudienceValue.csvConfirmed) {
        Message.warning("请先确认 UID CSV 导入结果");
        return;
      }
      if (!mergedUidAudience.finalUids.length) {
        Message.warning("请至少输入或导入一个有效 UID");
        return;
      }
    }
    if (triggerType === "event" && !eventValidation.valid) {
      Message.warning(eventValidation.reason || "系统事件配置不完整");
      return;
    }
    if (
      triggerType === "manual" &&
      form.getFieldValue("scheduleMode") === "scheduled" &&
      (!form.getFieldValue("scheduledAt") || !form.getFieldValue("timezone"))
    ) {
      Message.warning("请选择计划发送时间和任务时区");
      return;
    }
    if (!translationReady) {
      Message.warning("仍有目标语言未完成人工审核，不能提交业务审核");
      return;
    }
    if (
      channels.includes("站内信") &&
      hasUnsafeMarkdownLinks(content.web.body)
    ) {
      Message.error(
        "站内信 Markdown 包含不允许的链接，仅支持 http、https 和 forxfinance 协议",
      );
      return;
    }
    if (
      channels.includes("站内信") &&
      content.web.targetUrl &&
      !validateActionUrl(content.web.targetUrl)
    ) {
      Message.error("站内信跳转链接未通过白名单校验");
      return;
    }
    if (
      channels.includes("Push") &&
      content.push.deepLink &&
      !validateActionUrl(content.push.deepLink)
    ) {
      Message.error("Push Deep Link 未通过白名单校验");
      return;
    }
    try {
      const task = submitTask(
        submission(),
        editingTask ? copiedTask?.id : undefined,
      );
      Modal.success({
        title: "已提交审核",
        content: `任务 ${task.id} 已冻结最新内容、受众、渠道、时间、有效期${triggerType === "event" ? "和事件策略" : ""}，并进入审核中心；旧审批已自动失效。`,
        onOk: () => navigate("/tasks"),
      });
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "任务提交失败");
    }
  };
  const prepareTemporaryLanguageContent = () => {
    if (!channels.length) {
      Message.warning("请至少选择站内信或 App Push");
      return;
    }
    if (!temporaryContentComplete) {
      Message.warning("请先完整填写所选发送渠道的默认语言文案");
      return;
    }
    const currentContent = {
      ...temporary,
      sourceLocale: temporarySourceLocale,
      locales: [temporarySourceLocale, ...targetLocales],
    };
    const sourceContent = {
      title:
        channels.length === 1 && channels.includes("Push")
          ? temporary.push.title
          : channels.length === 1
            ? temporary.web.title
            : `站内信：${temporary.web.title} / Push：${temporary.push.title}`,
      summary: channels.includes("站内信")
        ? temporary.web.summary
        : undefined,
      body:
        channels.length === 1 && channels.includes("Push")
          ? temporary.push.body
          : channels.length === 1
            ? temporary.web.body
            : `【站内信】\n${temporary.web.body}\n\n【App Push】\n${temporary.push.body}`,
    };
    const requiresBatch =
      targetLocales.length > 0 ||
      requiresSpecialLanguageReview(temporarySourceLocale);
    const draft = requiresBatch
      ? saveTemplate({
          name: `临时消息 · ${form.getFieldValue("name") || "未命名"}`,
          category: form.getFieldValue("category") || "系统公告",
          nature: resolvedNature,
          risk: form.getFieldValue("risk") || "低",
          channels,
          locales: currentContent.locales,
          sourceLocale: temporarySourceLocale,
          content: currentContent,
          variables: [
            "user_nickname",
            "amount",
            "currency",
            "symbol",
            "occurred_at",
          ],
          owner: "临时任务",
          usageScope: "manual",
        })
      : undefined;
    const subject = draft
      ? {
          type: "manual_task_content" as const,
          id: draft.id,
          name: draft.name,
          version: draft.version,
          returnPath: "/tasks/create",
        }
      : undefined;
    const batch =
      targetLocales.length > 0 && subject
        ? createTranslationBatch({
            subject,
            sourceLocale: temporarySourceLocale,
            sourceContent,
            sourceChannelContent: currentContent,
            channels,
            targetLocales,
            createdBy: "Gary Ma",
          })
        : subject
          ? prepareSingleLanguageContent({
              subject,
              sourceLocale: temporarySourceLocale,
              sourceContent,
              createdBy: "Gary Ma",
            }).batch
          : undefined;
    setTemporaryBatchId(batch?.id);
    setTemporaryBatchChannels([...channels]);
    saveTaskDraft(
      {
        ...submission(),
        translationBatchId: batch?.id,
        content: currentContent,
      },
      editingTask ? copiedTask?.id : undefined,
    );
    Message.success(
      targetLocales.length
        ? `已创建机翻批次 ${batch?.id}，并保存可继续编辑的任务草稿`
        : batch
          ? `已提交语言审核 ${batch.id}，并保存可继续编辑的任务草稿`
          : "单语言内容准备完成，并已保存可继续编辑的任务草稿",
    );
  };

  const summary = useMemo(
    () => ({
      name: String(values.name || "未命名任务"),
      nature: resolvedNature,
      risk: (values.risk || "低") as RiskLevel,
      channels,
      content,
      audienceCount: audience.count,
      audienceLabel: audience.label,
      schedule,
      expiresAt,
      translationReady: Boolean(translationReady),
      triggerType,
      eventConfig,
      templateVersion: selectedTemplate?.version,
    }),
    [
      values.name,
      resolvedNature,
      values.risk,
      channels,
      content,
      audience,
      schedule,
      expiresAt,
      translationReady,
      triggerType,
      eventConfig,
      selectedTemplate?.version,
    ],
  );

  return (
    <section className="page-stack create-task-page">
      <PageHeader
        title="新建人工消息任务"
        description="支持审核通过的模板和临时消息；提交后锁定内容、受众、渠道、时间与有效期。"
        actions={
          <>
            <Button icon={<IconSave />} onClick={saveDraft}>
              保存草稿
            </Button>
            <Button icon={<IconArrowLeft />} onClick={() => navigate("/tasks")}>
              返回列表
            </Button>
          </>
        }
      />
      <div className="task-capability-strip">
        <span>仅显示全部目标语言人工审核通过的模板</span>
        <Tag color="green">翻译审核通过</Tag>
        <Tag color="arcoblue">站内信（Web + App）</Tag>
        <Tag color="purple">App Push</Tag>
      </div>
      <Card bordered={false} className="surface wizard-shell">
        <Steps
          current={current + 1}
          lineless
          labelPlacement="vertical"
          className="task-steps"
        >
          <Steps.Step title="内容与多语言" description="渠道、模板与临时消息" />
          <Steps.Step title="目标用户" description="受众与排除规则" />
          <Steps.Step title="发送策略" description="排期、有效期与渠道检查" />
          <Steps.Step title="预览并提交" description="冻结与审批" />
        </Steps>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: copiedTask
              ? editingTask
                ? copiedTask.name
                : `${copiedTask.name}（复制）`
              : undefined,
            business: copiedTask?.team || "消息运营",
            category: copiedTask?.category || "系统公告",
            risk: copiedTask?.risk || "低",
            template: approvedTemplates[0]?.id,
            audienceType: copiedTask?.audienceType || "all",
            priority: "普通",
            scheduleMode:
              editingTask && copiedTask && !["立即", "立即发送"].includes(copiedTask.schedule)
                ? "scheduled"
                : "now",
            quiet: "遵守并延迟",
          }}
          onValuesChange={updateSnapshot}
        >
          {current === 0 && (
            <div className="form-section">
              <h3>任务基础信息</h3>
              <Grid.Row gutter={20}>
                <Grid.Col span={8}>
                  <FormItem
                    label="任务名称"
                    field="name"
                    required
                    rules={[{ required: true, message: "请输入任务名称" }]}
                  >
                    <Input placeholder="例如：夏季交易赛召回" maxLength={100} />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="业务线" field="business" required>
                    <Select
                      options={[
                        "消息运营",
                        "增长运营",
                        "资金平台",
                        "风险控制",
                      ].map((value) => ({ label: value, value }))}
                    />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="消息分类" field="category" required>
                    <Select
                      options={store.categories
                        .filter((category) => category.enabled)
                        .map((category) => ({
                          label: category.name,
                          value: category.name,
                        }))}
                    />
                  </FormItem>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={20}>
                <Grid.Col span={8}>
                  <FormItem label="消息性质">
                    <Input
                      value={resolvedNature}
                      readOnly
                      suffix={<span>由消息分类自动确定</span>}
                    />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="风险等级" field="risk">
                    <Select
                      options={["低", "中", "高", "关键"].map((value) => ({
                        label: value,
                        value,
                      }))}
                    />
                  </FormItem>
                </Grid.Col>
              </Grid.Row>
              <div className="section-divider" />
              <h3>发送渠道</h3>
              <Alert
                type="info"
                content="先确定发送渠道，模板、临时内容、多语言和预览将按渠道筛选。站内信内容由 Web 与 App 共用。"
              />
              <FormItem label="正式发送渠道" required>
                <Checkbox.Group
                  value={channels}
                  onChange={(value) => updateChannels(value as Channel[])}
                >
                  <Checkbox value="站内信">站内信（Web + App）</Checkbox>
                  <Checkbox value="Push">App Push</Checkbox>
                </Checkbox.Group>
              </FormItem>
              {triggerType === "event" ? (
                <EventTriggerFields
                  events={store.events}
                  templates={eventTemplates}
                  eventId={eventId}
                  templateId={templateId}
                  value={eventConfig}
                  onEventChange={(id, config) => {
                    setEventId(id);
                    setEventConfig(config);
                  }}
                  onTemplateChange={(id, config) => {
                    setTemplateId(id);
                    setEventConfig(config);
                  }}
                  onChange={setEventConfig}
                />
              ) : (
                <>
                  <div className="section-divider" />
                  <h3>内容来源</h3>
                  <Radio.Group
                    type="button"
                    value={contentMode}
                    onChange={setContentMode}
                  >
                    <Radio value="template">审核通过模板</Radio>
                    <Radio value="temporary">临时消息</Radio>
                  </Radio.Group>
                  {contentMode === "template" ? (
                    <div className="template-source-panel">
                      {!approvedTemplates.length && (
                        <Alert
                          type="warning"
                          title="当前渠道暂无可用模板"
                          content="请调整发送渠道，或切换为临时消息继续创建。"
                        />
                      )}
                      <FormItem
                        label="消息模板"
                        field="template"
                        required
                        extra="仅显示全部目标语言人工审核通过的模板"
                      >
                        <Select
                          value={selectedTemplate?.id}
                          onChange={setTemplateId}
                          disabled={!approvedTemplates.length}
                          options={approvedTemplates.map((item) => ({
                            label: `${item.name} · ${item.channels.join(" + ")}`,
                            value: item.id,
                          }))}
                        />
                      </FormItem>
                      {selectedTemplate && (
                        <>
                          <Alert
                            type="success"
                            content={`翻译审核通过 · ${selectedTemplate.translationBatchId} · ${selectedTemplate.locales.join("、")}`}
                          />
                          <MessagePreview
                            content={content}
                            channels={channels}
                            compact
                            showPushPriority={false}
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="temporary-content-editor">
                      <Alert
                        type={targetLocales.length ? "warning" : "info"}
                        content={
                          targetLocales.length
                            ? "多语言临时消息将提交外部机器翻译，返回后逐语言人工审核；内容仅冻结在当前任务版本中。"
                            : directReviewRequired
                              ? "单语言临时消息，无需机器翻译；当前语言需要专项人工审核，内容仅冻结在当前任务版本中。"
                              : "单语言临时消息，无需机器翻译；语言准备可直接完成，内容仅冻结在当前任务版本中。"
                        }
                      />
                      <Grid.Row gutter={20}>
                        {channels.includes("站内信") && (
                          <Grid.Col span={channels.length === 1 ? 24 : 12}>
                            <h3>站内信内容（Web + App 共用）</h3>
                            <FormItem label="站内信标题">
                              <Input
                                aria-label="站内信标题"
                                value={temporary.web.title}
                                onChange={(value) => patchWeb({ title: value })}
                              />
                            </FormItem>
                            <FormItem label="站内信摘要">
                              <Input.TextArea
                                aria-label="站内信摘要"
                                value={temporary.web.summary}
                                onChange={(value) =>
                                  patchWeb({ summary: value })
                                }
                              />
                            </FormItem>
                            <FormItem label="站内信正文">
                              <MarkdownEditor
                                value={temporary.web.body}
                                onChange={(value) => patchWeb({ body: value })}
                              />
                            </FormItem>
                            <FormItem label="风险提示">
                              <Input
                                value={temporary.web.riskCopy}
                                onChange={(value) =>
                                  patchWeb({ riskCopy: value })
                                }
                              />
                            </FormItem>
                            <Grid.Row gutter={12}>
                              <Grid.Col span={8}>
                                <FormItem label="按钮文案">
                                  <Input
                                    value={temporary.web.actionText}
                                    onChange={(value) =>
                                      patchWeb({ actionText: value })
                                    }
                                  />
                                </FormItem>
                              </Grid.Col>
                              <Grid.Col span={16}>
                                <FormItem label="跳转链接">
                                  <Input
                                    value={temporary.web.targetUrl}
                                    onChange={(value) =>
                                      patchWeb({ targetUrl: value })
                                    }
                                  />
                                </FormItem>
                              </Grid.Col>
                            </Grid.Row>
                          </Grid.Col>
                        )}
                        {channels.includes("Push") && (
                          <Grid.Col span={channels.length === 1 ? 24 : 12}>
                            <h3>App Push 内容</h3>
                            <FormItem label="Push 标题">
                              <Input
                                aria-label="Push 标题"
                                value={temporary.push.title}
                                onChange={(value) =>
                                  patchPush({ title: value })
                                }
                              />
                            </FormItem>
                            <FormItem label="Push 正文">
                              <Input.TextArea
                                aria-label="Push 正文"
                                value={temporary.push.body}
                                onChange={(value) =>
                                  patchPush({ body: value })
                                }
                              />
                            </FormItem>
                            <FormItem label="Push 图片">
                              <Input
                                value={temporary.push.imageUrl}
                                onChange={(value) =>
                                  patchPush({ imageUrl: value })
                                }
                              />
                            </FormItem>
                            <FormItem label="Push Deep Link">
                              <Input
                                value={temporary.push.deepLink}
                                onChange={(value) =>
                                  patchPush({ deepLink: value })
                                }
                              />
                            </FormItem>
                            <Grid.Row gutter={12}>
                              <Grid.Col span={24}>
                                <FormItem label="设备平台">
                                  <Select
                                    value={temporary.push.platform}
                                    onChange={(value) =>
                                      patchPush({ platform: value })
                                    }
                                    options={[
                                      "全部设备",
                                      "iOS",
                                      "Android",
                                    ].map((value) => ({ label: value, value }))}
                                  />
                                </FormItem>
                              </Grid.Col>
                            </Grid.Row>
                          </Grid.Col>
                        )}
                      </Grid.Row>
                      <div className="translation-submit-strip">
                        <Select
                          aria-label="临时消息默认语言"
                          value={temporarySourceLocale}
                          onChange={updateTemporarySourceLocale}
                          options={supportedLocales.map((value) => ({
                            label: value,
                            value,
                          }))}
                        />
                        <Select
                          aria-label="临时消息目标语言"
                          mode="multiple"
                          placeholder="可留空，表示单语言临时消息"
                          value={targetLocales}
                          onChange={setTargetLocales}
                          options={supportedLocales
                            .filter((value) => value !== temporarySourceLocale)
                            .map((value) => ({
                              label: value,
                              value,
                            }))}
                        />
                        <Button
                          type="primary"
                          onClick={prepareTemporaryLanguageContent}
                        >
                          {temporaryLanguageAction}
                        </Button>
                        {temporaryBatchId && (
                          <Tag color={translationReady ? "green" : "orange"}>
                            {temporaryBatchId} · {currentBatch?.status}
                          </Tag>
                        )}
                      </div>
                      {temporaryBatchId && !translationScopeCurrent && (
                        <Alert
                          type="warning"
                          title="语言配置或发送渠道已变更"
                          content="现有语言批次的内容范围与当前配置不一致，请按当前配置重新创建语言任务后再提交审核。"
                        />
                      )}
                      {currentBatch && temporaryTranslationTemplate && (
                        <TranslationWorkflowPanel
                          template={temporaryTranslationTemplate}
                          batch={currentBatch}
                          context="temporary-task"
                        />
                      )}
                      <MessagePreview
                        content={content}
                        channels={channels}
                        showPushPriority={false}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {current === 1 && (
            <div className="form-section">
              <h3>目标用户</h3>
              {triggerType === "event" ? (
                <>
                  <Alert
                    type="info"
                    title="事件主体用户"
                    content="受众由系统事件中的 user_id 在触发时确定；事件任务不能改为全站、VIP、代理或活动人群。"
                  />
                  <Descriptions
                    column={2}
                    border
                    data={[
                      { label: "受众方式", value: "事件主体用户" },
                      { label: "预计单次受众", value: "1 人" },
                      { label: "用户字段", value: "user_id" },
                    ]}
                  />
                </>
              ) : (
                <>
                  <p>
                    发送前再次校验授权、退订、抑制名单、地区限制和重复 UID。
                  </p>
                  <FormItem label="受众方式" field="audienceType">
                    <Radio.Group type="button" onChange={setAudienceType}>
                      <Radio value="all">全部用户</Radio>
                      <Radio value="uid">指定用户</Radio>
                      <Radio value="vip">指定 VIP</Radio>
                      <Radio value="agent">指定代理</Radio>
                      <Radio value="campaign">活动参与用户</Radio>
                    </Radio.Group>
                  </FormItem>
                  <Grid.Row gutter={20}>
                    <Grid.Col span={audienceType === "uid" ? 16 : 12}>
                      {audienceType === "uid" ? (
                        <UidAudienceImporter
                          value={uidAudienceValue}
                          onChange={setUidAudienceValue}
                        />
                      ) : audienceType === "vip" ? (
                        <FormItem label="VIP 等级" required>
                          <Select
                            mode="multiple"
                            defaultValue={["VIP 4-6"]}
                            options={["VIP 1-3", "VIP 4-6", "VIP 7-9"].map(
                              (value) => ({ label: value, value }),
                            )}
                          />
                        </FormItem>
                      ) : audienceType === "agent" ? (
                        <FormItem label="代理 UID/层级" required>
                          <Input defaultValue="AGT-1008" />
                        </FormItem>
                      ) : audienceType === "campaign" ? (
                        <FormItem label="活动参与状态" required>
                          <Select
                            defaultValue="joined"
                            options={[
                              { label: "夏季交易赛 · 已报名", value: "joined" },
                              {
                                label: "夏季交易赛 · 已完成",
                                value: "finished",
                              },
                            ]}
                          />
                        </FormItem>
                      ) : (
                        <FormItem label="全站范围">
                          <Select
                            defaultValue="active"
                            options={[
                              { label: "全部有效用户", value: "active" },
                              { label: "近30天活跃用户", value: "trading" },
                            ]}
                          />
                        </FormItem>
                      )}
                    </Grid.Col>
                    <Grid.Col span={audienceType === "uid" ? 8 : 12}>
                      <FormItem label="排除分群">
                        <Select
                          mode="multiple"
                          placeholder="选择排除分群"
                          options={[
                            {
                              label: "高风险提现保护名单 · 120,480",
                              value: "withdrawal-risk",
                            },
                            {
                              label: "账户异常抑制名单 · 8,241",
                              value: "account-risk",
                            },
                          ]}
                        />
                      </FormItem>
                    </Grid.Col>
                  </Grid.Row>
                  <div className="audience-preview">
                    <div>
                      <span>原始受众</span>
                      <strong>{audience.count.toLocaleString()}</strong>
                    </div>
                    <i>→</i>
                    <div>
                      <span>规则过滤</span>
                      <strong>
                        - {Math.round(audience.count * 0.047).toLocaleString()}
                      </strong>
                    </div>
                    <i>→</i>
                    <div>
                      <span>预计可发送</span>
                      <strong>
                        {Math.round(audience.count * 0.953).toLocaleString()}
                      </strong>
                    </div>
                    <Button
                      onClick={() =>
                        Message.success("已刷新预计受众人数")
                      }
                    >
                      刷新人数
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          {current === 2 && (
            <div className="form-section">
              <h3>发送策略</h3>
              {triggerType === "event" && (
                <Alert
                  type="info"
                  title="事件到达时发送"
                  content={`事件 ${eventConfig?.eventId || "未选择"} 到达后立即执行；有效期 ${eventConfig?.eventTtlSeconds || 0} 秒，失败最多重试 ${eventConfig?.maxRetries || 0} 次。下方人工排期字段对事件任务不生效。`}
                />
              )}
              <Grid.Row gutter={20}>
                <Grid.Col span={8}>
                  <FormItem label="正式发送渠道">
                    <Space>
                      {channels.map((channel) => (
                        <Tag
                          key={channel}
                          color={channel === "Push" ? "purple" : "arcoblue"}
                        >
                          {channel === "Push" ? "App Push" : "站内信（Web + App）"}
                        </Tag>
                      ))}
                    </Space>
                  </FormItem>
                </Grid.Col>
                {triggerType === "manual" && (
                  <Grid.Col span={8}>
                    <FormItem label="发送模式" field="scheduleMode">
                      <Select
                        options={[
                          { label: "立即发送", value: "now" },
                          { label: "指定时间发送", value: "scheduled" },
                        ]}
                      />
                    </FormItem>
                  </Grid.Col>
                )}
                {triggerType === "manual" && values.scheduleMode === "scheduled" && (
                  <>
                    <Grid.Col span={8}>
                      <FormItem
                        label="计划发送时间"
                        field="scheduledAt"
                        required
                        rules={[{ required: true, message: "请选择计划发送时间" }]}
                        extra={editingTask && copiedTask ? `原计划：${copiedTask.schedule}，请重新确认` : undefined}
                      >
                        <DatePicker showTime style={{ width: "100%" }} />
                      </FormItem>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <FormItem
                        label="任务时区"
                        field="timezone"
                        required
                        rules={[{ required: true, message: "请选择任务时区" }]}
                      >
                        <Select
                          options={["Asia/Shanghai", "UTC"].map((value) => ({
                            label: value,
                            value,
                          }))}
                        />
                      </FormItem>
                    </Grid.Col>
                  </>
                )}
                <Grid.Col span={8}>
                  <FormItem
                    label="消息有效期"
                    field="expireAt"
                    extra={
                      editingTask && copiedTask?.expiresAt
                        ? `留空则保留 ${copiedTask.expiresAt}`
                        : undefined
                    }
                  >
                    <DatePicker showTime style={{ width: "100%" }} />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="安静时段策略" field="quiet">
                    <Select
                      options={[
                        { label: "遵守并延迟", value: "遵守并延迟" },
                        { label: "命中后跳过", value: "跳过" },
                      ]}
                    />
                  </FormItem>
                </Grid.Col>
              </Grid.Row>
              {channels.includes("Push") && (
                <Alert
                  type="info"
                  title="App Push 正式发送检查"
                  content={
                    triggerType === "event"
                      ? "提交前校验 APNs/FCM 状态、通知权限、有效设备 Token、Deep Link 白名单、折叠键和优先级；临时失败退避重试，永久失败使 Token 失效。"
                      : "提交前校验 APNs/FCM 状态、通知权限、有效设备 Token 和 Deep Link 白名单；临时失败退避重试，永久失败使 Token 失效。"
                  }
                />
              )}
              <MessagePreview
                content={content}
                channels={channels}
                compact
                showPushPriority={triggerType === "event"}
              />
            </div>
          )}
          {current === 3 && <TaskSummary data={summary} />}
        </Form>
        <div className="wizard-footer">
          <Button
            disabled={current === 0}
            onClick={() => {
              updateSnapshot();
              setCurrent((value) => value - 1);
            }}
          >
            上一步
          </Button>
          <Space>
            <Button
              onClick={() => Message.success("测试消息已送达 3 个内部测试账号")}
            >
              测试发送
            </Button>
            {current < 3 ? (
              <Button type="primary" onClick={next}>
                下一步
              </Button>
            ) : (
              <Button type="primary" icon={<IconCheck />} onClick={submit}>
                提交审核
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </section>
  );
}
