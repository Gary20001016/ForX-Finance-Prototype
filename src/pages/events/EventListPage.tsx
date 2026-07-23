import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Input,
  Message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import type {
  EventNotificationRule,
  SystemEventDefinition,
} from "../../domain/types";
import {
  testSystemEvent,
  usePrototypeStore,
} from "../../store/prototypeStore";
import WritePermissionButton from "../../components/WritePermissionButton";
import { useCurrentPagePermission } from "../../components/PagePermissionBoundary";
import { canWritePage } from "../../domain/pagePermissions";
import { CURRENT_REVIEW_OPERATOR_ID } from "../../domain/reviewOperators";
import { getEventVariableDefinitions } from "../../domain/eventVariables";

export default function EventListPage() {
  const { canWrite } = useCurrentPagePermission();
  const navigate = useNavigate();
  const store = usePrototypeStore();
  const currentOperator = store.operators.find(
    (operator) => operator.id === CURRENT_REVIEW_OPERATOR_ID,
  );
  const canCreateRule = canWritePage(currentOperator, "event.rules");
  const [keyword, setKeyword] = useState("");
  const [line, setLine] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [ruleUsage, setRuleUsage] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const selected = store.events.find((event) => event.id === selectedId);
  const selectedVariables = selected
    ? getEventVariableDefinitions(selected.id, selected.variables)
    : [];
  const relatedRules = (eventId: string) =>
    store.rules.filter((rule) => rule.eventId === eventId);
  const data = useMemo(
    () =>
      store.events.filter(
        (event) =>
          `${event.id}${event.name}`
            .toLowerCase()
            .includes(keyword.toLowerCase()) &&
          (!line || event.line === line) &&
          (!status || event.status === status) &&
          (!ruleUsage ||
            (ruleUsage === "with"
              ? relatedRules(event.id).length > 0
              : relatedRules(event.id).length === 0)),
      ),
    [store.events, store.rules, keyword, line, status, ruleUsage],
  );
  const sendTest = () => {
    if (!canWrite) {
      Message.warning("当前账号无写权限");
      return;
    }
    if (!selected) return;
    const result = testSystemEvent(selected.id);
    if (result.ok)
      Message.success(
        `测试事件已通过规则 ${result.ruleId} 生成触发记录 ${result.triggerId}`,
      );
    else Message.error(result.reason || "测试事件执行失败");
  };
  const ruleColumns = [
    {
      title: "通知规则",
      render: (_: unknown, rule: EventNotificationRule) => (
        <div>
          <Typography.Text className="strong">{rule.name}</Typography.Text>
          <div className="mono muted">{rule.id}</div>
        </div>
      ),
    },
    {
      title: "当前内容版本",
      render: (_: unknown, rule: EventNotificationRule) => {
        const version = store.ruleVersions.find(
          (item) => item.id === rule.currentVersionId,
        );
        return <span className="mono">{version?.version || "—"}</span>;
      },
    },
    {
      title: "触发条件",
      render: (_: unknown, rule: EventNotificationRule) =>
        rule.conditionExpression,
    },
    {
      title: "渠道",
      render: (_: unknown, rule: EventNotificationRule) => (
        <Space>
          {rule.channels.map((channel) => (
            <Tag key={channel}>{channel}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "状态",
      render: (_: unknown, rule: EventNotificationRule) => (
        <StatusTag status={rule.status} />
      ),
    },
  ];

  return (
    <section className="page-stack">
      <PageHeader
        title="事件目录"
        description="由后台事件注册中心统一维护；操作者可查询事件、查看字段，并用于创建通知规则。"
        tags={<Tag color="arcoblue">后台同步 · 只读</Tag>}
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setLine(undefined);
          setStatus(undefined);
          setRuleUsage(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索事件编码或名称"
          style={{ width: 280 }}
        />
        <Select
          placeholder="业务线"
          value={line}
          onChange={setLine}
          allowClear
          style={{ width: 140 }}
          options={["资产", "交易", "风控", "奖励"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <Select
          placeholder="运行状态"
          value={status}
          onChange={setStatus}
          allowClear
          style={{ width: 140 }}
          options={["运行正常", "轻微延迟", "待联调"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <Select
          placeholder="关联通知规则"
          value={ruleUsage}
          onChange={setRuleUsage}
          allowClear
          style={{ width: 160 }}
          options={[
            { label: "有通知规则", value: "with" },
            { label: "无通知规则", value: "without" },
          ]}
        />
      </FilterBar>
      <ResourceTable
        data={data}
        rowKey="id"
        columns={[
          {
            title: "事件",
            width: 280,
            render: (_: unknown, record: SystemEventDefinition) => (
              <div>
                <Typography.Text className="strong">
                  {record.name}
                </Typography.Text>
                <div className="mono muted">{record.id}</div>
              </div>
            ),
          },
          { title: "业务线", dataIndex: "line", width: 90 },
          {
            title: "可用消息变量",
            width: 130,
            render: (_: unknown, record: SystemEventDefinition) => (
              <Button type="text" onClick={() => setSelectedId(record.id)}>
                {record.variables.length} 个
              </Button>
            ),
          },
          {
            title: "关联通知规则",
            width: 150,
            render: (_: unknown, record: SystemEventDefinition) => {
              const rules = relatedRules(record.id);
              const enabled = rules.filter(
                (rule) => rule.status === "已启用",
              ).length;
              return (
                <div>
                  <strong>{rules.length}</strong> 个
                  <div className="muted">已启用 {enabled}</div>
                </div>
              );
            },
          },
          { title: "近24h调用", dataIndex: "calls", width: 110 },
          { title: "失败率", dataIndex: "failure", width: 90 },
          { title: "最后调用", dataIndex: "last", width: 120 },
          {
            title: "运行状态",
            width: 110,
            render: (_: unknown, record: SystemEventDefinition) => (
              <StatusTag status={record.status} />
            ),
          },
          {
            title: "操作",
            fixed: "right" as const,
            width: 80,
            render: (_: unknown, record: SystemEventDefinition) => (
              <Button type="text" onClick={() => setSelectedId(record.id)}>
                详情
              </Button>
            ),
          },
        ]}
      />
      <Drawer
        width={980}
        visible={Boolean(selected)}
        title={selected ? `事件详情 · ${selected.name}` : "事件详情"}
        onCancel={() => setSelectedId(undefined)}
        footer={
          selected && (
            <Space>
              <WritePermissionButton
                allowed={canCreateRule}
                onClick={() =>
                  navigate("/automation", { state: { eventId: selected.id } })
                }
              >
                创建通知规则
              </WritePermissionButton>
              <WritePermissionButton type="primary" onClick={sendTest}>
                发送测试事件
              </WritePermissionButton>
            </Space>
          )
        }
      >
        {selected && (
          <>
            <Descriptions
              column={3}
              border
              data={[
                { label: "事件编码", value: selected.id },
                { label: "版本", value: selected.version },
                { label: "调用方", value: selected.caller },
                { label: "业务线", value: selected.line },
                { label: "变量数量", value: selectedVariables.length },
                { label: "最近测试", value: selected.lastTestAt || "尚未测试" },
              ]}
            />
            <Alert
              style={{ margin: "16px 0" }}
              type="info"
              title="事件字段 Schema（后台同步）"
              content="事件定义与 Schema 由后台同步；下表说明当前事件可在通知模板正文中引用的变量。"
            />
            <div className="drawer-section-title">
              <strong>可用消息变量</strong>
              <span className="muted">模板通过插入变量引用，无需手工输入</span>
            </div>
            <Table
              rowKey="name"
              pagination={false}
              data={selectedVariables}
              columns={[
                {
                  title: "模板变量",
                  width: 220,
                  render: (_: unknown, record) => (
                    <code>{`{{ ${record.name} }}`}</code>
                  ),
                },
                { title: "说明", dataIndex: "description" },
                { title: "示例", dataIndex: "example", width: 240 },
              ]}
            />
            <div className="drawer-section-title">
              <strong>关联通知规则</strong>
              <span className="muted">
                规则负责条件、用户映射、渠道和内容版本
              </span>
            </div>
            {relatedRules(selected.id).length ? (
              <Table
                rowKey="id"
                pagination={false}
                data={relatedRules(selected.id)}
                columns={ruleColumns}
              />
            ) : (
              <Alert
                type="warning"
                title="尚无通知规则"
                content="该事件当前不会生成通知。请创建通知规则、发布首个内容版本并启用后再发送测试事件。"
              />
            )}
          </>
        )}
      </Drawer>
    </section>
  );
}
