import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Input,
  Select,
  Space,
  Typography,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import type { TriggerRecord } from "../../domain/types";
import { usePrototypeStore } from "../../store/prototypeStore";

export default function TriggerRecordPage() {
  const store = usePrototypeStore();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [eventId, setEventId] = useState<string>();
  const [ruleId, setRuleId] = useState<string>();
  const [selected, setSelected] = useState<TriggerRecord>();
  const data = useMemo(
    () =>
      store.triggerRecords.filter(
        (record) =>
          `${record.id}${record.eventInstanceId}${record.user}${record.idempotencyKey}`
            .toLowerCase()
            .includes(keyword.toLowerCase()) &&
          (!status || record.status === status) &&
          (!eventId || record.eventId === eventId) &&
          (!ruleId || record.ruleId === ruleId),
      ),
    [store.triggerRecords, keyword, status, eventId, ruleId],
  );

  const columns: TableColumnProps<TriggerRecord>[] = [
    {
      title: "触发记录",
      width: 210,
      render: (_, record) => (
        <div>
          <Typography.Text className="mono strong">{record.id}</Typography.Text>
          <div className="mono muted">{record.eventInstanceId}</div>
        </div>
      ),
    },
    {
      title: "事件",
      width: 210,
      render: (_, record) => {
        const event = store.events.find((item) => item.id === record.eventId);
        return (
          <div>
            {event?.name || record.eventId}
            <div className="mono muted">{record.eventId}</div>
          </div>
        );
      },
    },
    {
      title: "命中规则",
      width: 210,
      render: (_, record) => {
        const rule = store.rules.find((item) => item.id === record.ruleId);
        return (
          <div>
            {rule?.name || record.ruleId}
            <div className="mono muted">{record.ruleId}</div>
          </div>
        );
      },
    },
    {
      title: "冻结内容版本",
      width: 140,
      render: (_, record) => {
        const version = store.ruleVersions.find(
          (item) => item.id === record.contentVersionId,
        );
        return (
          <div>
            <span className="mono">{version?.version || record.contentVersionId}</span>
            <div className="muted">模板 {record.templateVersion}</div>
          </div>
        );
      },
    },
    { title: "用户", dataIndex: "user", width: 130 },
    {
      title: "状态",
      width: 110,
      render: (_, record) => <StatusTag status={record.status} />,
    },
    {
      title: "渠道结果",
      width: 135,
      render: (_, record) => (
        <div>
          {record.successCount}/{record.channelTotal} 成功
          {record.failureCount > 0 && (
            <div className="error-copy">{record.failureCount} 失败</div>
          )}
        </div>
      ),
    },
    { title: "接收时间", dataIndex: "receivedAt", width: 150 },
    {
      title: "幂等键",
      width: 240,
      render: (_, record) => <span className="mono">{record.idempotencyKey}</span>,
    },
    {
      title: "操作",
      fixed: "right",
      width: 80,
      render: (_, record) => (
        <Button type="text" onClick={() => setSelected(record)}>
          详情
        </Button>
      ),
    },
  ];

  const deliveries = selected
    ? store.deliveries.filter((item) => item.triggerId === selected.id)
    : [];

  return (
    <section className="page-stack">
      <PageHeader
        title="触发记录"
        description="每条记录代表某条事件命中某条规则的一次执行；其结果不会把长期规则改成“已完成”或“失败”。"
      />
      <Alert
        type="info"
        content="幂等范围固定为规则编号 + 事件实例编号。内容版本不参与幂等键，版本热切换不会导致同一事件重复发送。"
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setStatus(undefined);
          setEventId(undefined);
          setRuleId(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="触发编号、事件实例、UID 或幂等键"
          style={{ width: 300 }}
        />
        <Select
          value={eventId}
          onChange={setEventId}
          allowClear
          showSearch
          placeholder="系统事件"
          style={{ width: 210 }}
          options={store.events.map((event) => ({
            label: `${event.name} · ${event.id}`,
            value: event.id,
          }))}
        />
        <Select
          value={ruleId}
          onChange={setRuleId}
          allowClear
          placeholder="通知规则"
          style={{ width: 210 }}
          options={store.rules.map((rule) => ({ label: rule.name, value: rule.id }))}
        />
        <Select
          value={status}
          onChange={setStatus}
          allowClear
          placeholder="执行结果"
          style={{ width: 140 }}
          options={[
            "已接收",
            "已过滤",
            "重复抑制",
            "处理中",
            "已完成",
            "部分失败",
            "失败",
            "已过期",
          ].map((value) => ({ label: value, value }))}
        />
      </FilterBar>
      <ResourceTable data={data} columns={columns} rowKey="id" />
      <Drawer
        width={820}
        visible={Boolean(selected)}
        title={selected ? `触发详情 · ${selected.id}` : "触发详情"}
        onCancel={() => setSelected(undefined)}
        footer={null}
      >
        {selected && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Descriptions
              column={2}
              border
              data={[
                { label: "事件实例编号", value: selected.eventInstanceId },
                { label: "执行状态", value: <StatusTag status={selected.status} /> },
                { label: "事件编码", value: selected.eventId },
                { label: "命中规则", value: selected.ruleId },
                { label: "规则版本", value: selected.ruleVersion },
                { label: "冻结内容版本", value: selected.contentVersionId },
                { label: "模板版本", value: selected.templateVersion },
                { label: "目标用户", value: selected.user },
                { label: "幂等键", value: <span className="mono">{selected.idempotencyKey}</span> },
                { label: "接收时间", value: selected.receivedAt },
                { label: "完成时间", value: selected.completedAt || "—" },
                { label: "结果说明", value: selected.reason || "执行完成" },
              ]}
            />
            <div>
              <div className="drawer-section-title">
                <strong>关联渠道发送</strong>
                <span className="muted">一条触发记录可拆分为多个渠道实例</span>
              </div>
              {deliveries.length ? (
                <ResourceTable
                  data={deliveries}
                  rowKey="id"
                  columns={[
                    { title: "发送实例", dataIndex: "id" },
                    { title: "渠道", dataIndex: "channel" },
                    {
                      title: "状态",
                      render: (_: unknown, item: (typeof deliveries)[number]) => (
                        <StatusTag status={item.status} />
                      ),
                    },
                    { title: "送达时间", dataIndex: "deliveredAt" },
                  ]}
                />
              ) : (
                <Alert type="info" content="该触发被过滤或抑制，没有创建渠道发送实例。" />
              )}
            </div>
          </Space>
        )}
      </Drawer>
    </section>
  );
}
