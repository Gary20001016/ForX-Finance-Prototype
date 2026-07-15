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
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
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
  registerSystemEvent,
  testSystemEvent,
  usePrototypeStore,
} from "../../store/prototypeStore";

export default function EventListPage() {
  const navigate = useNavigate();
  const store = usePrototypeStore();
  const [keyword, setKeyword] = useState("");
  const [line, setLine] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const selected = store.events.find((event) => event.id === selectedId);
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
          (!status || event.status === status),
      ),
    [store.events, keyword, line, status],
  );
  const register = async () => {
    try {
      const values = await form.validate();
      registerSystemEvent({
        id: values.id,
        name: values.name,
        line: values.line,
        version: values.version,
        caller: values.caller,
        description: values.description,
        variables: values.variables
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean),
      });
      Message.success("事件已注册并进入待联调状态");
      setCreating(false);
      form.resetFields();
    } catch {
      /* form validation */
    }
  };
  const sendTest = () => {
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
        description="只维护上游业务事件的编码、版本与字段 Schema；通知内容和发送策略由事件通知规则管理。"
        actions={
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => setCreating(true)}
          >
            注册事件
          </Button>
        }
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setLine(undefined);
          setStatus(undefined);
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
          placeholder="调用状态"
          value={status}
          onChange={setStatus}
          allowClear
          style={{ width: 140 }}
          options={["运行正常", "轻微延迟", "待联调"].map((value) => ({
            label: value,
            value,
          }))}
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
          { title: "版本", dataIndex: "version", width: 90 },
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
          {
            title: "调用方",
            dataIndex: "caller",
            width: 170,
            render: (value: unknown) => <Tag>{String(value)}</Tag>,
          },
          { title: "近24h调用", dataIndex: "calls", width: 110 },
          { title: "失败率", dataIndex: "failure", width: 90 },
          { title: "最后调用", dataIndex: "last", width: 120 },
          {
            title: "状态",
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
              <Button
                onClick={() =>
                  Message.success("事件 Schema 与字段定义校验通过")
                }
              >
                校验 Schema
              </Button>
              <Button
                onClick={() =>
                  navigate("/automation", { state: { eventId: selected.id } })
                }
              >
                创建通知规则
              </Button>
              <Button type="primary" onClick={sendTest}>
                发送测试事件
              </Button>
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
                { label: "变量数量", value: selected.variables.length },
                { label: "最近测试", value: selected.lastTestAt || "尚未测试" },
              ]}
            />
            <Alert
              style={{ margin: "16px 0" }}
              type="info"
              title="事件字段 Schema"
              content={selected.variables
                .map((value) => `{{ ${value} }}`)
                .join(" · ")}
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
      <Modal
        visible={creating}
        title="注册业务事件"
        onCancel={() => setCreating(false)}
        onOk={register}
        okText="注册并待联调"
        style={{ width: 780 }}
        unmountOnExit
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            version: "1.0.0",
            line: "资产",
            ttl: 300,
            variables: "user_nickname, amount, currency, symbol, occurred_at",
          }}
        >
          <Grid.Row gutter={16}>
            <Grid.Col span={12}>
              <Form.Item
                label="事件编码"
                field="id"
                required
                rules={[{ required: true }]}
              >
                <Input placeholder="deposit.credited" />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={12}>
              <Form.Item
                label="事件名称"
                field="name"
                required
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={8}>
              <Form.Item label="业务线" field="line">
                <Select
                  options={["资产", "交易", "风控", "奖励"].map((value) => ({
                    label: value,
                    value,
                  }))}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={8}>
              <Form.Item label="事件版本" field="version">
                <Input />
              </Form.Item>
            </Grid.Col>
            <Grid.Col span={8}>
              <Form.Item label="建议 TTL" field="ttl">
                <InputNumber min={1} suffix="秒" style={{ width: "100%" }} />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
          <Form.Item
            label="调用方"
            field="caller"
            required
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="事件说明" field="description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            label="事件字段"
            field="variables"
            extra="逗号分隔；通知规则会将这些事件字段映射到模板变量"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
