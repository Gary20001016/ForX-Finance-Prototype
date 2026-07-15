import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Grid,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import type { TableColumnProps } from "@arco-design/web-react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import type {
  EventNotificationRule,
  RuleContentVersion,
  RuleContentVersionOperation,
} from "../../domain/types";
import {
  advanceRuleContentVersion,
  changeEventRuleStatus,
  createEventRule,
  createRuleContentVersion,
  createRuleTranslationBatch,
  publishRuleContentVersion,
  reviewEventRule,
  updateRuleContentVersion,
  usePrototypeStore,
} from "../../store/prototypeStore";
import { getEventRuleOperations } from "./automationLifecycle";
import MultilingualProgressCell from "../multilingual/MultilingualProgressCell";
import MultilingualProgressDrawer from "../multilingual/MultilingualProgressDrawer";
import { templateSupportsScope } from "../templates/templateScope";

const localeOptions = ["en-US", "ja-JP", "ko-KR", "fr-FR", "es-ES"];

const versionAction = (
  status: RuleContentVersion["status"],
): RuleContentVersionOperation | "发布版本" | undefined => {
  if (status === "草稿") return "提交机翻";
  if (status === "机翻处理中") return "机翻完成";
  if (status === "待人工审核") return "人工审核通过";
  if (status === "待审核") return "通过审核";
  if (status === "待生效") return "发布版本";
  return undefined;
};

export default function AutomationRuleListPage() {
  const location = useLocation();
  const routeEventId = (location.state as { eventId?: string } | null)?.eventId;
  const store = usePrototypeStore();
  const eventTemplates = store.templates.filter((template) =>
    templateSupportsScope(template, "event"),
  );
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [eventId, setEventId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(Boolean(routeEventId));
  const [versionEditor, setVersionEditor] = useState(false);
  const [progressBatchId, setProgressBatchId] = useState<string>();
  const [versionDraft, setVersionDraft] = useState({
    title: "",
    body: "",
    targetLocales: ["en-US"],
  });
  const [form] = Form.useForm();
  const selected = store.rules.find((item) => item.id === selectedId);
  const currentVersion = selected
    ? store.ruleVersions.find((item) => item.id === selected.currentVersionId)
    : undefined;
  const versions = selected
    ? store.ruleVersions.filter((item) => item.ruleId === selected.id)
    : [];
  const recentTriggers = selected
    ? store.triggerRecords.filter((item) => item.ruleId === selected.id)
    : [];

  const data = useMemo(
    () =>
      store.rules.filter(
        (rule) =>
          `${rule.id}${rule.name}${rule.eventId}`
            .toLowerCase()
            .includes(keyword.toLowerCase()) &&
          (!status || rule.status === status) &&
          (!eventId || rule.eventId === eventId),
      ),
    [store.rules, keyword, status, eventId],
  );

  const openVersionEditor = () => {
    if (!currentVersion) return;
    setVersionDraft({
      title: currentVersion.title,
      body: currentVersion.body,
      targetLocales: currentVersion.targetLocales.filter(
        (locale) => locale !== currentVersion.sourceLocale,
      ),
    });
    setVersionEditor(true);
  };

  const saveNewVersion = () => {
    if (!selected || !versionDraft.title.trim() || !versionDraft.body.trim()) {
      Message.error("请填写消息标题和正文");
      return;
    }
    const version = createRuleContentVersion(selected.id);
    updateRuleContentVersion(version.id, versionDraft);
    setVersionEditor(false);
    Message.success(`${version.version} 已创建；现网规则继续使用原版本`);
  };

  const createRule = async () => {
    try {
      const values = await form.validate();
      const template = store.templates.find((item) => item.id === values.templateId);
      const rule = createEventRule({
        name: values.name,
        eventId: values.eventId,
        conditionExpression: values.conditionExpression,
        subjectMapping: values.subjectMapping,
        channels: values.channels,
        templateId: values.templateId,
        templateVersion: template?.version || "v1",
        title: values.title,
        body: values.body,
        targetLocales: values.targetLocales || [],
        owner: values.owner,
      });
      setCreating(false);
      form.resetFields();
      setSelectedId(rule.id);
      Message.success("事件通知规则草稿已创建");
    } catch {
      // Form validation keeps the modal open.
    }
  };

  const operateRule = (rule: EventNotificationRule, operation: string) => {
    if (operation === "创建内容版本") return openVersionEditor();
    if (operation === "提交审核" || operation === "撤回审核") {
      changeEventRuleStatus(rule.id, operation);
      Message.success(`规则已${operation}`);
      return;
    }
    if (operation === "启用规则" || operation === "停用规则") {
      Modal.confirm({
        title: `${operation} · ${rule.name}`,
        content:
          operation === "停用规则"
            ? "停用后不再处理新事件，已生成的触发记录和发送记录不受影响。"
            : "启用后将开始监听新事件，当前生效内容版本会立即用于触发。",
        okText: `确认${operation.slice(0, 2)}`,
        onOk: () => changeEventRuleStatus(rule.id, operation),
      });
      return;
    }
    if (operation === "取消规则" || operation === "编辑规则") {
      changeEventRuleStatus(rule.id, operation);
      Message.success(operation === "编辑规则" ? "规则已回到草稿" : "规则已取消");
    }
  };

  const advanceVersion = (
    version: RuleContentVersion,
    operation: RuleContentVersionOperation | "发布版本",
  ) => {
    if (operation === "提交机翻") {
      const batch = createRuleTranslationBatch(version.id);
      setProgressBatchId(batch.id);
      Message.success(`${version.version} 已创建外部机翻任务`);
      return;
    }
    if (operation === "发布版本") {
      Modal.confirm({
        title: `发布 ${version.version}`,
        content:
          "发布将原子切换当前内容版本；规则保持启用，新的事件使用新版本，已进入处理的事件仍使用冻结的旧版本。",
        okText: "确认发布",
        onOk: () => {
          publishRuleContentVersion(version.id);
          Message.success(`${version.version} 已成为当前生效版本`);
        },
      });
      return;
    }
    advanceRuleContentVersion(version.id, operation);
    Message.success(`${version.version}：${operation}`);
  };

  const columns: TableColumnProps<EventNotificationRule>[] = [
    {
      title: "通知规则",
      width: 240,
      render: (_, rule) => (
        <div>
          <Typography.Text className="strong">{rule.name}</Typography.Text>
          <div className="mono muted">{rule.id}</div>
        </div>
      ),
    },
    {
      title: "系统事件",
      width: 210,
      render: (_, rule) => {
        const event = store.events.find((item) => item.id === rule.eventId);
        return (
          <div>
            {event?.name || rule.eventId}
            <div className="mono muted">{rule.eventId}</div>
          </div>
        );
      },
    },
    { title: "触发条件", dataIndex: "conditionExpression", width: 210 },
    {
      title: "当前内容版本",
      width: 180,
      render: (_, rule) => {
        const version = store.ruleVersions.find(
          (item) => item.id === rule.currentVersionId,
        );
        return version ? (
          <div>
            <span className="mono">{version.version}</span>
            <div className="muted">模板 {version.templateVersion}</div>
          </div>
        ) : (
          <span className="muted">尚未发布</span>
        );
      },
    },
    {
      title: "渠道",
      width: 150,
      render: (_, rule) => (
        <Space size="mini">
          {rule.channels.map((channel) => (
            <Tag key={channel} color={channel === "Push" ? "purple" : "arcoblue"}>
              {channel}
            </Tag>
          ))}
        </Space>
      ),
    },
    { title: "近24h触发", dataIndex: "triggerCount24h", width: 110 },
    {
      title: "成功率",
      width: 90,
      render: (_, rule) => `${rule.successRate}%`,
    },
    {
      title: "状态",
      width: 100,
      render: (_, rule) => <StatusTag status={rule.status} />,
    },
    { title: "负责人", dataIndex: "owner", width: 110 },
    {
      title: "操作",
      fixed: "right",
      width: 80,
      render: (_, rule) => (
        <Button type="text" onClick={() => setSelectedId(rule.id)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <section className="page-stack">
      <PageHeader
        title="事件通知规则"
        description="配置事件监听、触发条件、目标用户、渠道与内容版本；单次发送结果不会改变规则状态。"
        actions={
          <Button type="primary" icon={<IconPlus />} onClick={() => setCreating(true)}>
            创建通知规则
          </Button>
        }
      />
      <Alert
        type="info"
        content="规则是长期自动化配置；内容通过独立版本完成外部机翻、人工审核与业务审批后原子切换，切换期间规则不中断。"
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setStatus(undefined);
          setEventId(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索规则名称、编号或事件"
          style={{ width: 280 }}
        />
        <Select
          value={eventId}
          onChange={setEventId}
          allowClear
          showSearch
          placeholder="系统事件"
          style={{ width: 220 }}
          options={store.events.map((event) => ({
            label: `${event.name} · ${event.id}`,
            value: event.id,
          }))}
        />
        <Select
          value={status}
          onChange={setStatus}
          allowClear
          placeholder="规则状态"
          style={{ width: 140 }}
          options={["草稿", "待审核", "待修改", "已启用", "已停用", "已取消", "已过期"].map(
            (value) => ({ label: value, value }),
          )}
        />
      </FilterBar>
      <ResourceTable data={data} columns={columns} rowKey="id" />

      <Drawer
        width={1040}
        visible={Boolean(selected)}
        title={selected ? `规则详情 · ${selected.name}` : "规则详情"}
        onCancel={() => setSelectedId(undefined)}
        footer={
          selected ? (
            <Space>
              {selected.status === "待审核" && (
                <>
                  <Button status="danger" onClick={() => reviewEventRule(selected.id, "reject")}>
                    驳回规则
                  </Button>
                  <Button
                    type="primary"
                    disabled={!currentVersion || currentVersion.status !== "当前生效"}
                    onClick={() => reviewEventRule(selected.id, "approve")}
                  >
                    审核并启用
                  </Button>
                </>
              )}
              {getEventRuleOperations(selected.status)
                .filter((operation) => !["查看详情", "编辑规则"].includes(operation))
                .map((operation) => (
                  <Button
                    key={operation}
                    type={operation === "创建内容版本" ? "primary" : "default"}
                    status={operation === "停用规则" || operation === "取消规则" ? "danger" : "default"}
                    onClick={() => operateRule(selected, operation)}
                  >
                    {operation}
                  </Button>
                ))}
            </Space>
          ) : null
        }
      >
        {selected && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Descriptions
              column={3}
              border
              data={[
                { label: "规则编号", value: selected.id },
                { label: "规则状态", value: <StatusTag status={selected.status} /> },
                { label: "负责人", value: selected.owner },
                { label: "系统事件", value: selected.eventId },
                { label: "触发条件", value: selected.conditionExpression },
                { label: "主体映射", value: selected.subjectMapping },
                { label: "幂等键", value: <span className="mono">ruleId:eventInstanceId</span> },
                { label: "事件有效期", value: `${selected.eventTtlSeconds} 秒` },
                { label: "失败重试", value: `最多 ${selected.maxRetries} 次` },
              ]}
            />
            <div>
              <div className="drawer-section-title">
                <strong>内容版本</strong>
                <span className="muted">新版本发布前，现网持续使用当前版本</span>
              </div>
              <Table
                rowKey="id"
                pagination={false}
                data={versions}
                columns={[
                  { title: "版本", dataIndex: "version", width: 80 },
                  {
                    title: "标题",
                    dataIndex: "title",
                    ellipsis: true,
                  },
                  {
                    title: "语言",
                    width: 140,
                    render: (_: unknown, item: RuleContentVersion) =>
                      `${item.sourceLocale} + ${item.targetLocales.length}`,
                  },
                  {
                    title: "多语言流程",
                    width: 250,
                    render: (_: unknown, item: RuleContentVersion) => {
                      const batch = store.translationBatches.find(
                        (candidate) => candidate.id === item.translationBatchId,
                      );
                      return (
                        <MultilingualProgressCell
                          batch={batch}
                          onOpen={() => setProgressBatchId(batch?.id)}
                        />
                      );
                    },
                  },
                  {
                    title: "状态",
                    width: 120,
                    render: (_: unknown, item: RuleContentVersion) => (
                      <StatusTag status={item.status} />
                    ),
                  },
                  { title: "创建人", dataIndex: "createdBy", width: 110 },
                  {
                    title: "操作",
                    width: 150,
                    render: (_: unknown, item: RuleContentVersion) => {
                      const action = versionAction(item.status);
                      return action ? (
                        <Button type="text" onClick={() => advanceVersion(item, action)}>
                          {action}
                        </Button>
                      ) : (
                        <span className="muted">—</span>
                      );
                    },
                  },
                ]}
              />
            </div>
            <div>
              <div className="drawer-section-title">
                <strong>最近触发</strong>
                <span className="muted">规则状态与单次触发结果相互独立</span>
              </div>
              {recentTriggers.length ? (
                <Table
                  rowKey="id"
                  pagination={false}
                  data={recentTriggers.slice(0, 5)}
                  columns={[
                    { title: "触发编号", dataIndex: "id" },
                    { title: "事件实例", dataIndex: "eventInstanceId" },
                    { title: "冻结内容", dataIndex: "contentVersionId" },
                    {
                      title: "结果",
                      render: (_: unknown, item: (typeof recentTriggers)[number]) => (
                        <StatusTag status={item.status} />
                      ),
                    },
                    { title: "接收时间", dataIndex: "receivedAt" },
                  ]}
                />
              ) : (
                <Alert type="info" content="该规则还没有触发记录。" />
              )}
            </div>
          </Space>
        )}
      </Drawer>

      <Modal
        visible={versionEditor}
        title="创建内容版本"
        okText="保存新版本"
        onOk={saveNewVersion}
        onCancel={() => setVersionEditor(false)}
        style={{ width: 720 }}
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          content="保存后先进入草稿。目标语言将通过外部机翻任务生成，人工审核和业务审批通过后才能发布。"
        />
        <Form layout="vertical">
          <Form.Item label="消息标题" required>
            <Input
              aria-label="消息标题"
              value={versionDraft.title}
              onChange={(title) => setVersionDraft((value) => ({ ...value, title }))}
            />
          </Form.Item>
          <Form.Item label="消息正文" required>
            <Input.TextArea
              aria-label="消息正文"
              value={versionDraft.body}
              rows={6}
              onChange={(body) => setVersionDraft((value) => ({ ...value, body }))}
            />
          </Form.Item>
          <Form.Item label="目标语言">
            <Select
              mode="multiple"
              value={versionDraft.targetLocales}
              onChange={(targetLocales) =>
                setVersionDraft((value) => ({ ...value, targetLocales }))
              }
              options={localeOptions.map((value) => ({ label: value, value }))}
            />
          </Form.Item>
        </Form>
      </Modal>
      <MultilingualProgressDrawer
        batch={store.translationBatches.find((batch) => batch.id === progressBatchId)}
        visible={Boolean(progressBatchId)}
        onClose={() => setProgressBatchId(undefined)}
      />

      <Modal
        visible={creating}
        title="创建事件通知规则"
        okText="保存草稿"
        onOk={createRule}
        onCancel={() => setCreating(false)}
        style={{ width: 820 }}
        unmountOnExit
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            conditionExpression: "事件到达即触发",
            subjectMapping: "payload.user_id → UID",
            channels: ["站内信", "Push"],
            sourceLocale: "zh-CN",
            targetLocales: ["en-US"],
            owner: "消息运营",
            eventId: routeEventId,
          }}
        >
          <Grid.Row gutter={16}>
            <Grid.Col span={12}>
              <Form.Item label="规则名称" field="name" required rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="系统事件" field="eventId" required rules={[{ required: true }]}>
                <Select
                  showSearch
                  options={store.events.map((event) => ({
                    label: `${event.name} · ${event.id}`,
                    value: event.id,
                  }))}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="触发条件" field="conditionExpression">
                <Input />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="目标用户映射" field="subjectMapping">
                <Input />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="消息模板" field="templateId" required rules={[{ required: true }]}>
                <Select
                  options={eventTemplates.map((template) => ({
                    label: `${template.name} · ${template.version}`,
                    value: template.id,
                  }))}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="正式渠道" field="channels" required rules={[{ required: true }]}>
                <Select
                  mode="multiple"
                  options={["站内信", "Push"].map((value) => ({ label: value, value }))}
                />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
          <Form.Item label="中文标题" field="title" required rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="中文正文" field="body" required rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Grid.Row gutter={16}>
            <Grid.Col span={12}>
              <Form.Item label="目标语言" field="targetLocales">
                <Select
                  mode="multiple"
                  options={localeOptions.map((value) => ({ label: value, value }))}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="负责人" field="owner" required rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
        </Form>
      </Modal>
    </section>
  );
}
