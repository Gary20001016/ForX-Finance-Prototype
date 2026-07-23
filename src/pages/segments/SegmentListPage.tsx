import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import type { TableColumnProps } from "@arco-design/web-react";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import { segments } from "../../mocks/data";
import type { AudienceSegment } from "../../domain/types";
import WritePermissionButton from "../../components/WritePermissionButton";
import { useCurrentPagePermission } from "../../components/PagePermissionBoundary";
import {
  estimateSegmentSetCount,
  segmentDependsOn,
  segmentSetExpression,
  type SetOperation,
} from "./segmentSetOperations";
import { buildSegmentEditChanges } from "./segmentEditLog";
import {
  CURRENT_REVIEW_OPERATOR_ID,
  reviewOperatorName,
} from "../../domain/reviewOperators";

const defaultFormValues = {
  type: "动态条件",
  purpose: "营销",
  refresh: "每小时",
  field: "最近交易时间" as const,
  operator: "距今超过",
  threshold: 30,
  estimate: 328400,
};

const conditionFieldConfigs = {
  注册时间: {
    operators: ["距今超过", "距今不超过"],
    thresholdType: "days",
  },
  "KYC 国家": {
    operators: ["等于", "不等于"],
    thresholdType: "country",
  },
  总资产: {
    operators: ["等于", "大于", "小于"],
    thresholdType: "amount",
  },
  最近交易时间: {
    operators: ["距今超过", "距今不超过"],
    thresholdType: "days",
  },
  营销授权: {
    operators: ["等于", "不等于"],
    thresholdType: "authorization",
  },
} as const;

type ConditionField = keyof typeof conditionFieldConfigs;
const CURRENT_OPERATOR_NAME = reviewOperatorName(CURRENT_REVIEW_OPERATOR_ID);

const operationTimestamp = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export default function SegmentListPage() {
  const { canWrite } = useCurrentPagePermission();
  const [selected, setSelected] = useState<AudienceSegment>();
  const [data, setData] = useState(segments);
  const [editing, setEditing] = useState<AudienceSegment | "new">();
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<string>();
  const [purpose, setPurpose] = useState<string>();
  const [segmentType, setSegmentType] = useState("动态条件");
  const [conditionField, setConditionField] = useState<ConditionField>(
    defaultFormValues.field,
  );
  const [conditionOperator, setConditionOperator] = useState<
    string | undefined
  >(defaultFormValues.operator);
  const [setOperation, setSetOperation] =
    useState<SetOperation>("union");
  const [sourceSegmentIds, setSourceSegmentIds] = useState<string[]>([]);
  const [form] = Form.useForm();

  const filtered = data.filter(
    (item) =>
      `${item.id}${item.name}`.toLowerCase().includes(keyword.toLowerCase()) &&
      (!type || item.type === type) &&
      (!purpose || item.purpose === purpose),
  );
  const availableSegments = useMemo(
    () => {
      const editingSegmentId =
        editing && editing !== "new" ? editing.id : undefined;

      return data.filter(
        (segment) =>
          !editingSegmentId ||
          (segment.id !== editingSegmentId &&
            !segmentDependsOn(data, segment.id, editingSegmentId)),
      );
    },
    [data, editing],
  );
  const chosenSegments = useMemo(
    () =>
      sourceSegmentIds
        .map((id) => availableSegments.find((segment) => segment.id === id))
        .filter((segment): segment is AudienceSegment => Boolean(segment)),
    [availableSegments, sourceSegmentIds],
  );
  const setExpression = segmentSetExpression(
    availableSegments,
    sourceSegmentIds,
    setOperation,
  );
  const setEstimate = estimateSegmentSetCount(
    availableSegments,
    sourceSegmentIds,
    setOperation,
  );

  const save = async () => {
    if (!canWrite) {
      Message.warning("当前账号无写权限");
      return;
    }
    if (
      editing &&
      editing !== "new" &&
      editing.owner !== CURRENT_OPERATOR_NAME
    ) {
      Message.warning("仅创建人可编辑");
      return;
    }
    try {
      const values = await form.validate();
      if (segmentType === "组合分群" && sourceSegmentIds.length < 2) {
        Message.error("请至少选择 2 个分群");
        return;
      }
      const isCombined = segmentType === "组合分群";
      const rule = isCombined
        ? setExpression
        : `${values.field} ${values.operator} ${values.threshold}`;
      const nextValues = {
        ...values,
        owner:
          editing === "new" ? CURRENT_OPERATOR_NAME : editing?.owner,
        type: segmentType,
        count: isCombined ? setEstimate : values.estimate || 0,
        rule,
        setOperation: isCombined ? setOperation : undefined,
        sourceSegmentIds: isCombined ? sourceSegmentIds : undefined,
      };

      if (editing === "new") {
        setData((items) => {
          const createdSegment: AudienceSegment = {
            id: `SEG-${Date.now().toString().slice(-4)}`,
            name: nextValues.name,
            type: nextValues.type,
            purpose: nextValues.purpose,
            count: nextValues.count,
            change: 0,
            refresh: nextValues.refresh,
            updatedAt: "刚刚",
            owner: nextValues.owner,
            status: "计算中",
            rule: nextValues.rule,
            setOperation: nextValues.setOperation,
            sourceSegmentIds: nextValues.sourceSegmentIds,
          };
          const changes = buildSegmentEditChanges(undefined, createdSegment, [
            createdSegment,
            ...items,
          ]);

          return [
            {
              ...createdSegment,
              editLogs: [
                {
                  id: `SEG-LOG-${Date.now()}`,
                  action: "创建分群",
                  operator: CURRENT_OPERATOR_NAME,
                  operatedAt: operationTimestamp(),
                  changes,
                },
              ],
            },
            ...items,
          ];
        });
      } else if (editing) {
        setData((items) =>
          items.map((item) => {
            if (item.id !== editing.id) return item;

            const updatedSegment: AudienceSegment = {
              ...item,
              ...nextValues,
              updatedAt: "刚刚",
            };
            const changes = buildSegmentEditChanges(
              item,
              updatedSegment,
              items,
            );

            return {
              ...updatedSegment,
              editLogs: changes.length
                ? [
                    {
                      id: `SEG-LOG-${Date.now()}`,
                      action: "编辑规则" as const,
                      operator: CURRENT_OPERATOR_NAME,
                      operatedAt: operationTimestamp(),
                      changes,
                    },
                    ...(item.editLogs || []),
                  ]
                : item.editLogs,
            };
          }),
        );
      }
      Message.success(
        editing === "new" ? "分群已创建并开始计算" : "分群规则已更新",
      );
      setEditing(undefined);
    } catch {
      /* form validation */
    }
  };

  const changeConditionField = (value: ConditionField) => {
    setConditionField(value);
    setConditionOperator(undefined);
    form.setFieldsValue({ operator: undefined, threshold: undefined });
  };

  const renderThresholdControl = () => {
    const disabled = !conditionOperator;
    const thresholdType = conditionFieldConfigs[conditionField].thresholdType;

    if (thresholdType === "country") {
      return (
        <Select
          disabled={disabled}
          placeholder="请选择国家或地区"
          options={["中国", "日本", "韩国", "新加坡", "美国"].map(
            (value) => ({ label: value, value }),
          )}
        />
      );
    }

    if (thresholdType === "authorization") {
      return (
        <Select
          disabled={disabled}
          placeholder="请选择授权状态"
          options={["已授权", "未授权"].map((value) => ({
            label: value,
            value,
          }))}
        />
      );
    }

    return (
      <InputNumber
        disabled={disabled}
        min={0}
        suffix={thresholdType === "days" ? "天" : "USDT"}
        placeholder={
          thresholdType === "days" ? "请输入天数" : "请输入资产金额"
        }
        style={{ width: "100%" }}
      />
    );
  };

  const openEditor = (item: AudienceSegment | "new") => {
    if (item !== "new" && item.owner !== CURRENT_OPERATOR_NAME) {
      Message.warning("仅创建人可编辑");
      return;
    }
    setEditing(item);
    if (item === "new") {
      form.resetFields();
      form.setFieldsValue(defaultFormValues);
      setSegmentType("动态条件");
      setConditionField(defaultFormValues.field);
      setConditionOperator(defaultFormValues.operator);
      setSetOperation("union");
      setSourceSegmentIds([]);
      return;
    }
    const fallbackSources = data
      .filter(
        (segment) =>
          segment.id !== item.id &&
          !segmentDependsOn(data, segment.id, item.id),
      )
      .slice(0, 2)
      .map((segment) => segment.id);
    form.setFieldsValue({
      ...item,
      field: "最近交易时间",
      operator: "距今超过",
      threshold: 30,
      estimate: item.count,
    });
    setSegmentType(item.type);
    setConditionField(defaultFormValues.field);
    setConditionOperator(defaultFormValues.operator);
    setSetOperation(item.setOperation || "union");
    setSourceSegmentIds(item.sourceSegmentIds || fallbackSources);
  };

  const columns: TableColumnProps<AudienceSegment>[] = [
    {
      title: "分群",
      width: 240,
      render: (_, item) => (
        <div>
          <Typography.Text className="strong">{item.name}</Typography.Text>
          <div className="mono muted">{item.id}</div>
        </div>
      ),
    },
    {
      title: "类型 / 用途",
      width: 130,
      render: (_, item) => (
        <div>
          {item.type}
          <div>
            <Tag size="small">{item.purpose}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "当前人数",
      width: 150,
      render: (_, item) => (
        <div className="strong">
          {item.count.toLocaleString()}
          <div
            className={
              item.change >= 0
                ? "metric-change positive"
                : "metric-change negative"
            }
          >
            {item.change >= 0 ? "+" : ""}
            {item.change}%
          </div>
        </div>
      ),
    },
    { title: "规则摘要", dataIndex: "rule", width: 300 },
    {
      title: "刷新",
      width: 140,
      render: (_, item) => (
        <div>
          {item.refresh}
          <div className="muted">更新于 {item.updatedAt}</div>
        </div>
      ),
    },
    { title: "创建人", dataIndex: "owner", width: 120 },
    {
      title: "状态",
      width: 100,
      render: (_, item) => <StatusTag status={item.status} />,
    },
    {
      title: "操作",
      fixed: "right",
      width: 84,
      render: (_, item) => (
        <Button type="text" onClick={() => setSelected(item)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <section className="page-stack">
      <PageHeader
        title="用户分群"
        description="按地区、资产、交易行为和消息偏好构建可审计受众。"
        actions={
          <WritePermissionButton
            type="primary"
            icon={<IconPlus />}
            onClick={() => openEditor("new")}
          >
            新建分群
          </WritePermissionButton>
        }
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setType(undefined);
          setPurpose(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索分群名称或 ID"
          style={{ width: 260 }}
        />
        <Select
          placeholder="分群类型"
          value={type}
          onChange={setType}
          allowClear
          style={{ width: 140 }}
          options={["动态条件", "静态名单", "组合分群"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <Select
          placeholder="业务用途"
          value={purpose}
          onChange={setPurpose}
          allowClear
          style={{ width: 140 }}
          options={["营销", "服务", "事务", "抑制"].map((value) => ({
            label: value,
            value,
          }))}
        />
      </FilterBar>
      <ResourceTable data={filtered} columns={columns} rowKey="id" />

      <Drawer
        width={560}
        visible={Boolean(selected)}
        title={selected ? `分群详情 · ${selected.name}` : "分群详情"}
        onCancel={() => setSelected(undefined)}
        footer={
          <Space direction="vertical" align="end" size={4}>
            {selected?.owner !== CURRENT_OPERATOR_NAME && (
              <Typography.Text className="muted">
                仅创建人可编辑
              </Typography.Text>
            )}
            <WritePermissionButton
              type="primary"
              disabled={selected?.owner !== CURRENT_OPERATOR_NAME}
              onClick={() => {
                if (selected) {
                  openEditor(selected);
                  setSelected(undefined);
                }
              }}
            >
              编辑规则
            </WritePermissionButton>
          </Space>
        }
      >
        {selected && (
          <>
            <Descriptions
              column={1}
              border
              data={[
                { label: "分群 ID", value: selected.id },
                { label: "类型", value: selected.type },
                { label: "业务用途", value: selected.purpose },
                {
                  label: "当前人数",
                  value: selected.count.toLocaleString(),
                },
                ...(selected.type === "组合分群"
                  ? [
                      {
                        label: "集合运算",
                        value:
                          selected.setOperation === "intersection"
                            ? "交集"
                            : "并集",
                      },
                      {
                        label: "来源分群",
                        value: (selected.sourceSegmentIds || [])
                          .map(
                            (id) =>
                              data.find((segment) => segment.id === id)?.name ||
                              id,
                          )
                          .join("、"),
                      },
                    ]
                  : []),
                { label: "规则摘要", value: selected.rule },
                { label: "刷新方式", value: selected.refresh },
                { label: "创建人", value: selected.owner },
                {
                  label: "状态",
                  value: <StatusTag status={selected.status} />,
                },
              ]}
            />

            <div style={{ marginTop: 24 }}>
              <h3 style={{ margin: "0 0 16px" }}>编辑日志</h3>
              {(selected.editLogs || []).length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {(selected.editLogs || []).map((log) => (
                    <div
                      key={log.id}
                      style={{
                        border: "1px solid var(--color-border-2)",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "12px 14px",
                          background: "var(--color-fill-1)",
                        }}
                      >
                        <Space size={8}>
                          <Tag color="arcoblue">{log.action}</Tag>
                          <Typography.Text className="strong">
                            {log.operator}
                          </Typography.Text>
                        </Space>
                        <Typography.Text className="muted">
                          {log.operatedAt}
                        </Typography.Text>
                      </div>
                      <div style={{ padding: "6px 14px" }}>
                        {log.changes.map((change, index) => (
                          <div
                            key={`${log.id}-${change.field}`}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "88px minmax(0, 1fr) 20px minmax(0, 1fr)",
                              alignItems: "start",
                              gap: 8,
                              padding: "10px 0",
                              borderTop:
                                index === 0
                                  ? undefined
                                  : "1px solid var(--color-border-1)",
                            }}
                          >
                            <Typography.Text className="muted">
                              {change.field}
                            </Typography.Text>
                            <Typography.Text>{change.before}</Typography.Text>
                            <Typography.Text className="muted">
                              →
                            </Typography.Text>
                            <Typography.Text className="strong">
                              {change.after}
                            </Typography.Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="muted"
                  style={{
                    padding: 24,
                    textAlign: "center",
                    border: "1px dashed var(--color-border-2)",
                    borderRadius: 8,
                  }}
                >
                  暂无编辑记录
                </div>
              )}
            </div>
          </>
        )}
      </Drawer>

      <Modal
        visible={Boolean(editing)}
        title={
          editing === "new" ? "创建用户分群" : `编辑分群 · ${editing?.name}`
        }
        onCancel={() => setEditing(undefined)}
        onOk={save}
        okButtonProps={{ disabled: !canWrite }}
        okText="保存并计算"
        style={{ width: 880 }}
        unmountOnExit
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultFormValues}
        >
          <Grid.Row gutter={16}>
            <Grid.Col span={12}>
              <Form.Item
                label="分群名称"
                field="name"
                required
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item
                label="分群类型"
                field="type"
                extra={
                  editing !== "new" ? "创建后不可修改分群类型" : undefined
                }
              >
                <Radio.Group
                  type="button"
                  value={segmentType}
                  onChange={setSegmentType}
                  disabled={editing !== "new"}
                >
                  <Radio value="动态条件">动态条件</Radio>
                  <Radio value="静态名单">静态名单</Radio>
                  <Radio value="组合分群">组合分群</Radio>
                </Radio.Group>
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="业务用途" field="purpose">
                <Select
                  options={["事务", "服务", "营销", "抑制"].map(
                    (value) => ({ label: value, value }),
                  )}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item label="数据刷新" field="refresh">
                <Select
                  options={["实时", "每小时", "每日", "手动"].map(
                    (value) => ({ label: value, value }),
                  )}
                />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>

          {segmentType === "组合分群" ? (
            <div
              style={{
                marginTop: 8,
                padding: 20,
                border: "1px solid var(--color-border-2)",
                borderRadius: 8,
                background: "var(--color-fill-1)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>组合规则</h3>
              <Alert
                type="info"
                showIcon
                content="可组合动态条件、静态名单和已有组合分群；嵌套组合会保留原规则。第一期人数为前端原型预估。"
                style={{ marginBottom: 16 }}
              />
              <Form.Item label="集合运算" required>
                <Radio.Group
                  type="button"
                  value={setOperation}
                  onChange={setSetOperation}
                >
                  <Radio value="union">并集（满足任一分群）</Radio>
                  <Radio value="intersection">
                    交集（同时满足全部分群）
                  </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="参与组合的分群"
                required
                extra="至少选择 2 个；编辑时会自动排除自身和可能形成循环依赖的分群。"
              >
                <Select
                  mode="multiple"
                  value={sourceSegmentIds}
                  onChange={setSourceSegmentIds}
                  placeholder="请选择至少两个分群"
                  allowClear
                  showSearch
                  options={availableSegments.map((segment) => ({
                    value: segment.id,
                    label: `${segment.name} · ${segment.type} · ${segment.count.toLocaleString()} 人`,
                  }))}
                />
              </Form.Item>
              {chosenSegments.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text className="muted">已选分群</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {chosenSegments.map((segment) => (
                        <Tag key={segment.id} color="arcoblue">
                          {segment.name} · {segment.type} ·{" "}
                          {segment.count.toLocaleString()} 人
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              )}
              <Grid.Row gutter={12}>
                <Grid.Col span={16}>
                  <Form.Item label="集合表达式">
                    <Input
                      value={setExpression || "选择分群后自动生成"}
                      readOnly
                    />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="预估人数">
                    <Input
                      value={
                        sourceSegmentIds.length
                          ? `${setEstimate.toLocaleString()} 人`
                          : "等待选择"
                      }
                      readOnly
                    />
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
            </div>
          ) : (
            <>
              <h3>条件构建器</h3>
              <Grid.Row gutter={12}>
                <Grid.Col span={8}>
                  <Form.Item
                    label="字段"
                    field="field"
                    required
                    rules={[{ required: true, message: "请选择字段" }]}
                  >
                    <Select
                      onChange={changeConditionField}
                      options={Object.keys(conditionFieldConfigs).map(
                        (value) => ({ label: value, value }),
                      )}
                    />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item
                    label="运算符"
                    field="operator"
                    required
                    rules={[{ required: true, message: "请选择运算符" }]}
                  >
                    <Select
                      placeholder="请选择运算符"
                      onChange={setConditionOperator}
                      options={conditionFieldConfigs[
                        conditionField
                      ].operators.map((value) => ({ label: value, value }))}
                    />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item
                    label="阈值"
                    field="threshold"
                    required
                    rules={[{ required: true, message: "请设置阈值" }]}
                  >
                    {renderThresholdControl()}
                  </Form.Item>
                </Grid.Col>
              </Grid.Row>
              <Form.Item label="预估人数" field="estimate">
                <InputNumber disabled style={{ width: "100%" }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </section>
  );
}
