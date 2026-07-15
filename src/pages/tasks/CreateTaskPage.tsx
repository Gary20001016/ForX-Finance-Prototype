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
  Switch,
  Tag,
  TimePicker,
} from "@arco-design/web-react";
import {
  IconArrowLeft,
  IconCheck,
  IconSave,
} from "@arco-design/web-react/icon";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import MessagePreview from "../../components/MessagePreview";
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
import { templateSupportsScope } from "../templates/templateScope";

const FormItem = Form.Item;
const categoryOptions = [
  "系统公告",
  "交易通知",
  "资产通知",
  "安全通知",
  "奖励通知",
  "活动通知",
  "风控通知",
];
const localeOptions = [
  "en-US",
  "zh-TW",
  "ja-JP",
  "ko-KR",
  "es-ES",
  "tr-TR",
  "ru-RU",
  "fr-FR",
];
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
    priority: "高",
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
  const approvedTemplates = store.templates.filter(
    (template) =>
      template.translationReadiness === "全部审核通过" &&
      templateSupportsScope(template, "manual"),
  );
  const eventTemplates = store.templates.filter(
    (template) =>
      template.translationReadiness === "全部审核通过" &&
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
  const [templateId, setTemplateId] = useState(
    copiedTask?.templateId ||
      store.templates.find(
        (template) =>
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
  const [targetLocales, setTargetLocales] = useState<string[]>(
    copiedTask?.content?.locales.filter((locale) => locale !== "zh-CN") || [],
  );
  const [temporaryBatchId, setTemporaryBatchId] = useState<string | undefined>(
    copiedTask?.translationBatchId,
  );
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
  const selectedTemplate =
    store.templates.find((template) => template.id === templateId) ||
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
      : { ...temporary, locales: ["zh-CN", ...targetLocales] };
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
  const translationReady =
    contentMode === "template"
      ? selectedTemplate?.translationReadiness === "全部审核通过"
      : targetLocales.length === 0 || currentBatch?.status === "全部审核通过";
  const values = { ...snapshot, ...form.getFieldsValue() };
  const channels = (values.channels as Channel[] | undefined) || [
    "站内信",
    "Push",
  ];
  const schedule =
    triggerType === "event"
      ? "事件到达时"
      : values.scheduleMode === "original" && copiedTask
        ? copiedTask.schedule
        : values.scheduleMode === "now"
          ? "立即发送"
          : values.scheduleMode === "local"
            ? "用户本地时间发送"
            : values.scheduledAt
              ? String(values.scheduledAt)
              : "指定时间待填写";
  const expiresAt = values.expireAt
    ? String(values.expireAt)
    : editingTask && copiedTask?.expiresAt
      ? copiedTask.expiresAt
      : "发送后 24 小时";

  const updateSnapshot = () =>
    setSnapshot({ ...snapshot, ...form.getFieldsValue() });
  const patchWeb = (changes: Partial<LocalizedMessageContent["web"]>) =>
    setTemporary((value) => ({ ...value, web: { ...value.web, ...changes } }));
  const patchPush = (changes: Partial<LocalizedMessageContent["push"]>) =>
    setTemporary((value) => ({
      ...value,
      push: { ...value.push, ...changes },
    }));
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
      if (triggerType === "event" && !eventValidation.valid) {
        Message.warning(eventValidation.reason || "请完整配置系统事件触发策略");
        return;
      }
      if (
        contentMode === "temporary" &&
        (!temporary.web.title ||
          !temporary.web.summary ||
          !temporary.web.body ||
          !temporary.push.title ||
          !temporary.push.body)
      ) {
        Message.warning("请完整填写站内信与 App Push 内容");
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
    updateSnapshot();
    setCurrent((value) => Math.min(value + 1, 3));
  };
  const submission = () => ({
    name: (form.getFieldValue("name") || "未命名任务") as string,
    category: (form.getFieldValue("category") || "系统公告") as string,
    nature: (form.getFieldValue("nature") || "事务") as string,
    risk: (form.getFieldValue("risk") || "中") as RiskLevel,
    triggerType,
    contentMode,
    template:
      contentMode === "template"
        ? `${selectedTemplate?.code} ${selectedTemplate?.version}`
        : "临时消息 v1",
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
    if (!translationReady) {
      Message.warning("仍有目标语言未完成人工审核，不能提交业务审核");
      return;
    }
    if (content.web.targetUrl && !validateActionUrl(content.web.targetUrl)) {
      Message.error("站内信跳转链接未通过白名单校验");
      return;
    }
    if (content.push.deepLink && !validateActionUrl(content.push.deepLink)) {
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
  const createTemporaryTranslation = () => {
    if (!temporary.web.title || !temporary.web.body) {
      Message.warning("请先填写默认语言文案");
      return;
    }
    if (!targetLocales.length) {
      Message.warning("请至少选择一个目标语言");
      return;
    }
    const draft = saveTemplate({
      code: `temporary_${Date.now().toString().slice(-6)}`,
      name: `临时消息 · ${form.getFieldValue("name") || "未命名"}`,
      category: form.getFieldValue("category") || "系统公告",
      nature: form.getFieldValue("nature") || "事务",
      risk: form.getFieldValue("risk") || "中",
      channels: ["站内信", "Push"],
      locales: ["zh-CN", ...targetLocales],
      sourceLocale: "zh-CN",
      content: { ...temporary, locales: ["zh-CN", ...targetLocales] },
      variables: [
        "user_nickname",
        "amount",
        "currency",
        "symbol",
        "occurred_at",
      ],
      owner: "临时任务",
      usageScope: "manual",
    });
    const batch = createTranslationBatch({
      subject: {
        type: "manual_task_content",
        id: draft.id,
        name: draft.name,
        version: draft.version,
        returnPath: "/tasks/create",
      },
      sourceLocale: "zh-CN",
      sourceContent: {
        title: temporary.web.title,
        summary: temporary.web.summary,
        body: temporary.web.body,
      },
      targetLocales,
      createdBy: "Gary Ma",
    });
    setTemporaryBatchId(batch.id);
    saveTaskDraft(
      {
        ...submission(),
        translationBatchId: batch.id,
        content: { ...temporary, locales: ["zh-CN", ...targetLocales] },
      },
      editingTask ? copiedTask?.id : undefined,
    );
    Message.success(`已创建机翻批次 ${batch.id}，并保存可继续编辑的任务草稿`);
  };

  const summary = useMemo(
    () => ({
      name: String(values.name || "未命名任务"),
      nature: String(values.nature || "事务"),
      risk: (values.risk || "中") as RiskLevel,
      channels,
      content,
      audienceCount: audience.count,
      audienceLabel: audience.label,
      sampleUsers: audience.samples,
      schedule,
      expiresAt,
      translationReady: Boolean(translationReady),
      triggerType,
      eventConfig,
      templateVersion: selectedTemplate?.version,
    }),
    [
      values.name,
      values.nature,
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
        <span>仅显示全部目标语言人工审核通过的模板版本</span>
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
          <Steps.Step title="内容与多语言" description="模板或临时消息" />
          <Steps.Step title="目标用户" description="受众、排除与样例" />
          <Steps.Step title="发送策略" description="站内信与 App Push" />
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
            nature: copiedTask?.nature || "事务",
            risk: copiedTask?.risk || "中",
            template: approvedTemplates[0]?.id,
            channels: copiedTask?.channels || ["站内信", "Push"],
            audienceType: copiedTask?.audienceType || "all",
            timezone: "Asia/Shanghai",
            priority: "普通",
            scheduleMode: editingTask ? "original" : "now",
            quiet: "遵守并延迟",
            dedupe: true,
            rate: 1200,
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
                      options={categoryOptions.map((value) => ({
                        label: value,
                        value,
                      }))}
                    />
                  </FormItem>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row gutter={20}>
                <Grid.Col span={8}>
                  <FormItem label="消息性质" field="nature">
                    <Radio.Group type="button">
                      <Radio value="事务">事务</Radio>
                      <Radio value="服务">服务</Radio>
                      <Radio value="营销">营销</Radio>
                    </Radio.Group>
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
              <h3>发送方式</h3>
              <Alert
                type="info"
                content="当前创建人工发送任务。系统事件自动通知请前往“事件通知规则”配置。"
              />
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
                      <FormItem
                        label="消息模板"
                        field="template"
                        required
                        extra="仅显示全部目标语言人工审核通过的不可变模板版本"
                      >
                        <Select
                          value={templateId}
                          onChange={setTemplateId}
                          options={approvedTemplates.map((item) => ({
                            label: `${item.name} · ${item.version}`,
                            value: item.id,
                          }))}
                        />
                      </FormItem>
                      <Alert
                        type="success"
                        content={`翻译审核通过 · ${selectedTemplate?.translationBatchId} · ${selectedTemplate?.locales.join("、")}`}
                      />
                      <MessagePreview content={content} compact />
                    </div>
                  ) : (
                    <div className="temporary-content-editor">
                      <Alert
                        type="warning"
                        content="临时消息同样必须完成外部机翻和逐语言人工审核；内容仅冻结在当前任务版本中。"
                      />
                      <Grid.Row gutter={20}>
                        <Grid.Col span={12}>
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
                              value={temporary.web.summary}
                              onChange={(value) => patchWeb({ summary: value })}
                            />
                          </FormItem>
                          <FormItem label="站内信正文">
                            <Input.TextArea
                              rows={5}
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
                        <Grid.Col span={12}>
                          <h3>App Push 内容</h3>
                          <FormItem label="Push 标题">
                            <Input
                              aria-label="Push 标题"
                              value={temporary.push.title}
                              onChange={(value) => patchPush({ title: value })}
                            />
                          </FormItem>
                          <FormItem label="Push 正文">
                            <Input.TextArea
                              value={temporary.push.body}
                              onChange={(value) => patchPush({ body: value })}
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
                            <Grid.Col span={8}>
                              <FormItem label="设备平台">
                                <Select
                                  value={temporary.push.platform}
                                  onChange={(value) =>
                                    patchPush({ platform: value })
                                  }
                                  options={["全部设备", "iOS", "Android"].map(
                                    (value) => ({ label: value, value }),
                                  )}
                                />
                              </FormItem>
                            </Grid.Col>
                            <Grid.Col span={8}>
                              <FormItem label="优先级">
                                <Select
                                  value={temporary.push.priority}
                                  onChange={(value) =>
                                    patchPush({ priority: value })
                                  }
                                  options={["普通", "高", "紧急"].map(
                                    (value) => ({ label: value, value }),
                                  )}
                                />
                              </FormItem>
                            </Grid.Col>
                            <Grid.Col span={8}>
                              <FormItem label="折叠键">
                                <Input
                                  value={temporary.push.collapseKey}
                                  onChange={(value) =>
                                    patchPush({ collapseKey: value })
                                  }
                                />
                              </FormItem>
                            </Grid.Col>
                          </Grid.Row>
                        </Grid.Col>
                      </Grid.Row>
                      <div className="translation-submit-strip">
                        <Select
                          mode="multiple"
                          placeholder="选择目标语言"
                          value={targetLocales}
                          onChange={setTargetLocales}
                          options={localeOptions.map((value) => ({
                            label: value,
                            value,
                          }))}
                        />
                        <Button
                          type="primary"
                          onClick={createTemporaryTranslation}
                        >
                          创建外部机翻任务
                        </Button>
                        {temporaryBatchId && (
                          <Tag color={translationReady ? "green" : "orange"}>
                            {temporaryBatchId} · {currentBatch?.status}
                          </Tag>
                        )}
                      </div>
                      {currentBatch && temporaryTranslationTemplate && (
                        <TranslationWorkflowPanel
                          template={temporaryTranslationTemplate}
                          batch={currentBatch}
                          context="temporary-task"
                        />
                      )}
                      <MessagePreview content={content} />
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
                      { label: "测试样例", value: "UID TEST-001" },
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
                        Message.success("已生成新的受众快照和抽样用户")
                      }
                    >
                      刷新人数
                    </Button>
                  </div>
                  <Card title="受众样例" size="small">
                    {audience.samples.map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </Card>
                </>
              )}
            </div>
          )}
          {current === 2 && (
            <div className="form-section">
              <h3>发送与 App Push 策略</h3>
              {triggerType === "event" && (
                <Alert
                  type="info"
                  title="事件到达时发送"
                  content={`事件 ${eventConfig?.eventId || "未选择"} 到达后立即执行；有效期 ${eventConfig?.eventTtlSeconds || 0} 秒，失败最多重试 ${eventConfig?.maxRetries || 0} 次。下方人工排期字段对事件任务不生效。`}
                />
              )}
              <Grid.Row gutter={20}>
                <Grid.Col span={8}>
                  <FormItem label="正式渠道" field="channels">
                    <Checkbox.Group options={["站内信", "Push"]} />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="发送模式" field="scheduleMode">
                    <Select
                      options={[
                        ...(editingTask && copiedTask
                          ? [
                              {
                                label: `保留原计划 · ${copiedTask.schedule}`,
                                value: "original",
                              },
                            ]
                          : []),
                        { label: "立即发送", value: "now" },
                        { label: "指定时间", value: "scheduled" },
                        { label: "用户本地时间", value: "local" },
                      ]}
                    />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="计划发送时间" field="scheduledAt">
                    <DatePicker showTime style={{ width: "100%" }} />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="任务时区" field="timezone">
                    <Select
                      options={["Asia/Shanghai", "UTC"].map((value) => ({
                        label: value,
                        value,
                      }))}
                    />
                  </FormItem>
                </Grid.Col>
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
                  <FormItem label="本地发送时间" field="localTime">
                    <TimePicker style={{ width: "100%" }} />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem label="频控策略" field="frequency">
                    <Select
                      defaultValue="global"
                      options={[
                        { label: "全球营销 · 3次/24h", value: "global" },
                        { label: "活动级 · 1次/7d", value: "campaign" },
                      ]}
                    />
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
                <Grid.Col span={8}>
                  <FormItem label="发送速率（每秒）" field="rate">
                    <InputNumber min={1} max={5000} style={{ width: "100%" }} />
                  </FormItem>
                </Grid.Col>
                <Grid.Col span={8}>
                  <FormItem
                    label="用户去重"
                    field="dedupe"
                    triggerPropName="checked"
                  >
                    <Switch checkedText="按 UID 去重" />
                  </FormItem>
                </Grid.Col>
              </Grid.Row>
              <Alert
                type="info"
                title="App Push 正式发送检查"
                content="提交前校验 APNs/FCM 状态、通知权限、有效设备 Token、Deep Link 白名单、折叠键和优先级；临时失败退避重试，永久失败使 Token 失效。"
              />
              <MessagePreview content={content} compact />
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
