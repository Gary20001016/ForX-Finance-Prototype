import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
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
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import type { EventNotificationRule } from "../../domain/types";
import {
  CURRENT_REVIEW_OPERATOR_ID,
  reviewOperatorName,
} from "../../domain/reviewOperators";
import {
  changeEventRuleStatus,
  createEventRule,
  submitEventRuleForReview,
  updateEventRule,
  usePrototypeStore,
} from "../../store/prototypeStore";
import { getEventRuleOperations } from "./automationLifecycle";
import WritePermissionButton from "../../components/WritePermissionButton";
import { useCurrentPagePermission } from "../../components/PagePermissionBoundary";

type TriggerMode = "event" | "condition";

const CURRENT_OPERATOR_NAME = reviewOperatorName(CURRENT_REVIEW_OPERATOR_ID);
const numericVariablePattern =
  /(amount|balance|price|quantity|count|rate|ratio|margin|points|commission|fund)/i;
const dateVariablePattern = /(_at|time|date)$/i;

const conditionRelations = (variable?: string) => {
  if (!variable) return [];
  if (numericVariablePattern.test(variable)) {
    return [
      { label: "等于（=）", value: "=" },
      { label: "不等于（≠）", value: "!=" },
      { label: "大于（>）", value: ">" },
      { label: "大于等于（≥）", value: ">=" },
      { label: "小于（<）", value: "<" },
      { label: "小于等于（≤）", value: "<=" },
    ];
  }
  if (dateVariablePattern.test(variable)) {
    return [
      { label: "等于（=）", value: "=" },
      { label: "早于（<）", value: "<" },
      { label: "晚于（>）", value: ">" },
    ];
  }
  return [
    { label: "等于（=）", value: "=" },
    { label: "不等于（≠）", value: "!=" },
    { label: "包含", value: "contains" },
    { label: "不包含", value: "not_contains" },
  ];
};

const parseConditionExpression = (expression: string) => {
  if (!expression || expression === "事件到达即触发") {
    return {
      triggerMode: "event" as TriggerMode,
      conditionVariable: undefined,
      conditionOperator: undefined,
      conditionThreshold: undefined,
    };
  }
  const match = expression.match(
    /^(\S+)\s+(not_contains|contains|>=|<=|!=|=|>|<)\s+(.+)$/,
  );
  return {
    triggerMode: "condition" as TriggerMode,
    conditionVariable: match?.[1],
    conditionOperator: match?.[2],
    conditionThreshold: match?.[3],
  };
};

export default function AutomationRuleListPage() {
  const { canWrite } = useCurrentPagePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const routeEventId = (location.state as { eventId?: string } | null)?.eventId;
  const store = usePrototypeStore();
  const eventTemplates = store.templates.filter(
    (template) =>
      template.status === "已发布" &&
      template.usageScope === "event",
  );
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [eventId, setEventId] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(Boolean(routeEventId) && canWrite);
  const [editingRuleId, setEditingRuleId] = useState<string>();
  const [triggerMode, setTriggerMode] = useState<TriggerMode>("event");
  const [conditionEventId, setConditionEventId] = useState<string | undefined>(
    routeEventId,
  );
  const [conditionVariable, setConditionVariable] = useState<string>();
  const [reviewSubmitRuleId, setReviewSubmitRuleId] = useState<string>();
  const [replacementRuleIds, setReplacementRuleIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const editingRule = store.rules.find((item) => item.id === editingRuleId);
  const editingSnapshot = editingRule
    ? store.ruleVersions.find(
        (item) =>
          item.ruleId === editingRule.id &&
          (!editingRule.currentVersionId ||
            item.id === editingRule.currentVersionId),
      )
    : undefined;
  const editingCondition = editingRule
    ? parseConditionExpression(editingRule.conditionExpression)
    : undefined;
  const selected = store.rules.find((item) => item.id === selectedId);
  const selectedSnapshot = selected
    ? store.ruleVersions.find(
        (item) =>
          item.ruleId === selected.id &&
          (!selected.currentVersionId || item.id === selected.currentVersionId),
      )
    : undefined;
  const selectedTemplate = selectedSnapshot
    ? store.templates.find((item) => item.id === selectedSnapshot.templateId)
    : undefined;
  const recentTriggers = selected
    ? store.triggerRecords.filter((item) => item.ruleId === selected.id)
    : [];
  const reviewSubmitRule = store.rules.find(
    (item) => item.id === reviewSubmitRuleId,
  );
  const replacementCandidates = reviewSubmitRule
    ? store.rules.filter(
        (item) =>
          item.id !== reviewSubmitRule.id &&
          item.status === "已启用",
      )
    : [];
  const selectedConditionEvent = store.events.find(
    (item) => item.id === conditionEventId,
  );

  const resetCreateForm = () => {
    form.resetFields();
    setTriggerMode("event");
    setConditionEventId(routeEventId);
    setConditionVariable(undefined);
  };

  const openCreateForm = () => {
    resetCreateForm();
    setEditingRuleId(undefined);
    setCreating(true);
  };

  const closeRuleForm = () => {
    setCreating(false);
    setEditingRuleId(undefined);
    resetCreateForm();
  };

  const openEditForm = (rule: EventNotificationRule) => {
    if (!["草稿", "待修改"].includes(rule.status)) {
      Message.warning("当前规则状态不可编辑");
      return;
    }
    const snapshot = store.ruleVersions.find(
      (item) =>
        item.ruleId === rule.id &&
        (!rule.currentVersionId || item.id === rule.currentVersionId),
    );
    if (!snapshot) {
      Message.error("规则绑定内容不存在");
      return;
    }
    const condition = parseConditionExpression(rule.conditionExpression);
    resetCreateForm();
    setTriggerMode(condition.triggerMode);
    setConditionEventId(rule.eventId);
    setConditionVariable(condition.conditionVariable);
    setSelectedId(undefined);
    setCreating(false);
    setEditingRuleId(rule.id);
  };

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

  const saveRule = async () => {
    if (!canWrite) {
      Message.warning("当前账号无写权限");
      return;
    }
    try {
      const values = await form.validate();
      const template = store.templates.find((item) => item.id === values.templateId);
      if (!template || template.status !== "已发布") {
        Message.error("只能选择已发布的消息模板");
        return;
      }
      if (template.usageScope !== "event") {
        Message.error("消息模板必须来自事件消息模板");
        return;
      }
      if (!template?.content) {
        Message.error("所选模板缺少可用内容");
        return;
      }
      const conditionExpression =
        values.triggerMode === "condition"
          ? `${values.conditionVariable} ${values.conditionOperator} ${values.conditionThreshold}`
          : "事件到达即触发";
      const draftInput = {
        name: values.name,
        eventId: values.eventId,
        conditionExpression,
        subjectMapping: values.subjectMapping,
        channels: values.channels,
        templateId: values.templateId,
        templateVersion: template?.version || "v1",
        title: template.content.web.title || template.content.push.title,
        body: template.content.web.body || template.content.push.body,
        targetLocales: template.locales.filter(
          (locale) => locale !== template.sourceLocale,
        ),
      };
      const rule = editingRuleId
        ? updateEventRule(editingRuleId, draftInput)
        : createEventRule({
            ...draftInput,
            owner: CURRENT_OPERATOR_NAME,
          });
      const wasEditing = Boolean(editingRuleId);
      closeRuleForm();
      setSelectedId(rule.id);
      Message.success(
        wasEditing
          ? "事件通知规则已保存"
          : "事件通知规则草稿已创建",
      );
    } catch (error) {
      if (error instanceof Error) Message.error(error.message);
    }
  };

  const openReviewSubmission = (rule: EventNotificationRule) => {
    setReviewSubmitRuleId(rule.id);
    setReplacementRuleIds(rule.replacementRuleIds || []);
  };

  const submitRuleReview = () => {
    if (!reviewSubmitRule) return;
    try {
      submitEventRuleForReview(reviewSubmitRule.id, replacementRuleIds);
      setReviewSubmitRuleId(undefined);
      setReplacementRuleIds([]);
      Message.success(
        replacementRuleIds.length
          ? "规则已进入审核中心，审核通过后暂停规则已冻结"
          : "规则已进入审核中心，审核通过后直接启用",
      );
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "规则提审失败");
    }
  };

  const operateRule = (rule: EventNotificationRule, operation: string) => {
    if (!canWrite) {
      Message.warning("当前账号无写权限");
      return;
    }
    if (operation === "提交审核") {
      openReviewSubmission(rule);
      return;
    }
    if (operation === "撤回审核") {
      changeEventRuleStatus(rule.id, operation);
      Message.success(`规则已${operation}`);
      return;
    }
    if (operation === "编辑规则") {
      openEditForm(rule);
      return;
    }
    if (operation === "停用规则") {
      Modal.confirm({
        title: `${operation} · ${rule.name}`,
        content:
          "停用后不再处理新事件，且不能再次启用；已生成的发送结果不受影响。",
        okText: "确认停用",
        onOk: () => changeEventRuleStatus(rule.id, operation),
      });
      return;
    }
    if (operation === "取消规则") {
      changeEventRuleStatus(rule.id, operation);
      Message.success("规则已取消");
    }
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
        description="配置事件监听、触发条件、目标用户、渠道与事件消息模板；单次发送结果不会改变规则状态。"
        actions={
          <WritePermissionButton type="primary" icon={<IconPlus />} onClick={openCreateForm}>
            创建通知规则
          </WritePermissionButton>
        }
      />
      <Alert
        type="info"
        content="每条规则直接关联事件消息模板；模板修改并重新审核通过后，规则自动使用最新发布内容。"
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
                <Button type="primary" onClick={() => navigate("/approvals")}>
                  前往审核中心
                </Button>
              )}
              {getEventRuleOperations(selected.status)
                .filter((operation) => operation !== "查看详情")
                .map((operation) => (
                  <WritePermissionButton
                    key={operation}
                    type="default"
                    status={operation === "停用规则" || operation === "取消规则" ? "danger" : "default"}
                    onClick={() => operateRule(selected, operation)}
                  >
                    {operation}
                  </WritePermissionButton>
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
                {
                  label: "消息模板",
                  value: selectedTemplate
                    ? `${selectedTemplate.name} · ${selectedTemplate.id}`
                    : "未找到绑定模板",
                },
                { label: "触发条件", value: selected.conditionExpression },
                { label: "主体映射", value: selected.subjectMapping },
                { label: "幂等键", value: <span className="mono">ruleId:eventInstanceId</span> },
                { label: "事件有效期", value: `${selected.eventTtlSeconds} 秒` },
                { label: "失败重试", value: `最多 ${selected.maxRetries} 次` },
                ...(selected.replacementRuleIds?.length
                  ? [
                      {
                        label: "生效方式",
                        value: "审核通过后启用，并暂停所选规则",
                      },
                      {
                        label: "审核通过后暂停规则",
                        value: (
                          <Space direction="vertical" size="mini">
                            {selected.replacementRuleIds.map((ruleId) => {
                              const rule = store.rules.find(
                                (item) => item.id === ruleId,
                              );
                              return (
                                <span key={ruleId}>{`${rule?.name || "未知规则"} · ${ruleId}`}</span>
                              );
                            })}
                          </Space>
                        ),
                      },
                    ]
                  : selected.status === "待审核"
                    ? [
                        { label: "生效方式", value: "审核通过后直接启用" },
                        { label: "审核位置", value: "审核中心" },
                      ]
                    : []),
                ...(selected.replacedByRuleId
                  ? [
                      {
                        label: "暂停原因",
                        value: `已由 ${selected.replacedByRuleId} 暂停`,
                      },
                    ]
                  : []),
              ]}
            />
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
        visible={Boolean(reviewSubmitRule)}
        title={
          reviewSubmitRule
            ? `提交规则审核 · ${reviewSubmitRule.name}`
            : "提交规则审核"
        }
        okText="确认提审"
        onOk={submitRuleReview}
        onCancel={() => {
          setReviewSubmitRuleId(undefined);
          setReplacementRuleIds([]);
        }}
        unmountOnExit
        style={{ width: 720 }}
      >
        <Form layout="vertical">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            content="此处只配置审核通过后的动作；提审和审核期间不会暂停任何规则。"
          />
          <Form.Item label="审核通过后暂停的规则（可选）">
            {replacementCandidates.length ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                {replacementCandidates.map((rule) => {
                  const event = store.events.find(
                    (item) => item.id === rule.eventId,
                  );
                  return (
                    <Checkbox
                      key={rule.id}
                      checked={replacementRuleIds.includes(rule.id)}
                      onChange={(checked) =>
                        setReplacementRuleIds((ids) =>
                          checked
                            ? Array.from(new Set([...ids, rule.id]))
                            : ids.filter((id) => id !== rule.id),
                        )
                      }
                    >
                      <strong>{rule.name}</strong>
                      <span className="muted">
                        {` · ${rule.id}｜${event?.name || rule.eventId}｜${rule.conditionExpression}｜${rule.channels.join("+")}`}
                      </span>
                    </Checkbox>
                  );
                })}
              </Space>
            ) : (
              <span className="muted">当前没有其他已启用规则，可直接提审。</span>
            )}
          </Form.Item>
          {replacementRuleIds.length ? (
            <Alert
              type="warning"
              showIcon
              content={`审核通过时将先校验 ${replacementRuleIds.length} 条规则，随后在同一次状态变更中暂停所选规则并启用新规则。`}
            />
          ) : (
            <Alert type="info" content="未选择规则；审核通过后仅启用当前规则。" />
          )}
        </Form>
      </Modal>

      <Modal
        visible={creating || Boolean(editingRuleId)}
        title={editingRuleId ? "编辑事件通知规则" : "创建事件通知规则"}
        okText={editingRuleId ? "保存修改" : "保存草稿"}
        onOk={saveRule}
        okButtonProps={{ disabled: !canWrite }}
        onCancel={closeRuleForm}
        style={{ width: 820 }}
        unmountOnExit
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={
            editingRule && editingSnapshot && editingCondition
              ? {
                  name: editingRule.name,
                  eventId: editingRule.eventId,
                  triggerMode: editingCondition.triggerMode,
                  conditionVariable: editingCondition.conditionVariable,
                  conditionOperator: editingCondition.conditionOperator,
                  conditionThreshold: editingCondition.conditionThreshold,
                  subjectMapping: editingRule.subjectMapping,
                  templateId: editingSnapshot.templateId,
                  channels: editingRule.channels,
                }
              : {
                  triggerMode: "event",
                  subjectMapping: "payload.user_id → UID",
                  channels: ["站内信", "Push"],
                  eventId: routeEventId,
                }
          }
        >
          <Grid.Row gutter={16}>
            <Grid.Col span={12}>
              <Form.Item label="规则名称" field="name" required rules={[{ required: true }]}>
                <Input placeholder="例如：提现成功通知 V2" />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="系统事件" field="eventId" required rules={[{ required: true }]}>
                <Select
                  showSearch
                  onChange={(value) => {
                    setConditionEventId(value);
                    setConditionVariable(undefined);
                    form.setFieldsValue({
                      conditionVariable: undefined,
                      conditionOperator: undefined,
                      conditionThreshold: undefined,
                    });
                  }}
                  options={store.events.map((event) => ({
                    label: `${event.name} · ${event.id}`,
                    value: event.id,
                  }))}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item
                label="触发方式"
                field="triggerMode"
                required
                rules={[{ required: true }]}
              >
                <Select
                  onChange={(value: TriggerMode) => {
                    setTriggerMode(value);
                    if (value === "event") {
                      setConditionVariable(undefined);
                      form.setFieldsValue({
                        conditionVariable: undefined,
                        conditionOperator: undefined,
                        conditionThreshold: undefined,
                      });
                    }
                  }}
                  options={[
                    { label: "事件触发", value: "event" },
                    { label: "条件触发", value: "condition" },
                  ]}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="目标用户映射" field="subjectMapping">
                <Input />
              </Form.Item>
            </Grid.Col>
            {triggerMode === "condition" && (
              <>
                <Grid.Col span={8}>
                  <Form.Item
                    label="条件变量"
                    field="conditionVariable"
                    required
                    rules={[{ required: true, message: "请选择条件变量" }]}
                    extra="来自所选事件的字段 Schema"
                  >
                    <Select
                      disabled={!selectedConditionEvent}
                      placeholder={
                        selectedConditionEvent
                          ? "请选择变量"
                          : "请先选择系统事件"
                      }
                      onChange={(value) => {
                        setConditionVariable(value);
                        form.setFieldsValue({
                          conditionOperator: undefined,
                          conditionThreshold: undefined,
                        });
                      }}
                      options={(selectedConditionEvent?.variables || []).map(
                        (variable) => ({
                          label: variable,
                          value: variable,
                        }),
                      )}
                    />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item
                    label="关系"
                    field="conditionOperator"
                    required
                    rules={[{ required: true, message: "请选择关系" }]}
                  >
                    <Select
                      disabled={!conditionVariable}
                      placeholder="请选择关系"
                      options={conditionRelations(conditionVariable)}
                    />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item
                    label="阈值"
                    field="conditionThreshold"
                    required
                    rules={[{ required: true, message: "请输入阈值" }]}
                  >
                    <Input
                      disabled={!conditionVariable}
                      placeholder={
                        numericVariablePattern.test(conditionVariable || "")
                          ? "请输入数字"
                          : "请输入比较值"
                      }
                    />
                  </Form.Item>
                </Grid.Col>
              </>
            )}
            <Grid.Col span={12}>
              <Form.Item label="消息模板" field="templateId" required rules={[{ required: true }]}>
                <Select
                  options={eventTemplates.map((template) => ({
                    label: template.name,
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
          <Alert
            type="info"
            style={{ marginBottom: 16 }}
            content="内容与语言自动继承所选事件消息模板；模板修改并重新审核通过后，关联规则自动使用最新发布内容。"
          />
        </Form>
      </Modal>
    </section>
  );
}
