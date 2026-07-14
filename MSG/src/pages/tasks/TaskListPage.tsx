import { useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Input,
  Menu,
  Message,
  Modal,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconMore, IconPlus } from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import type { TableColumnProps } from "@arco-design/web-react";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import type { MessageTask } from "../../domain/types";
import MessagePreview from "../../components/MessagePreview";
import {
  updateTaskStatus,
  usePrototypeStore,
} from "../../store/prototypeStore";

const channelColors: Record<string, string> = {
  站内信: "arcoblue",
  Push: "purple",
};
export const canEditTask = (status: string) =>
  !["发送中", "已完成"].includes(status);

export default function TaskListPage() {
  const navigate = useNavigate();
  const store = usePrototypeStore();
  const tasks = store.tasks;
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [nature, setNature] = useState<string>();
  const [channel, setChannel] = useState<string>();
  const [selected, setSelected] = useState<MessageTask>();
  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const hit =
          `${task.id}${task.name}${task.creator}${task.eventConfig?.eventId || ""}`
            .toLowerCase()
            .includes(keyword.toLowerCase());
        return (
          hit &&
          (!status || task.status === status) &&
          (!nature || task.nature === nature) &&
          (!channel ||
            task.channels.includes(channel as MessageTask["channels"][number]))
        );
      }),
    [tasks, keyword, status, nature, channel],
  );

  const handleTaskAction = (key: string, row: MessageTask) => {
    if (key === "view") setSelected(row);
    if (key === "copy") {
      Message.info(`正在复制「${row.name}」的内容、受众与发送配置`);
      navigate("/tasks/create", { state: { copyTask: row } });
    }
    if (key === "edit" && canEditTask(row.status))
      navigate("/tasks/create", { state: { copyTask: row, resume: true } });
    if (key === "pause")
      Modal.confirm({
        title: `暂停任务 · ${row.name}`,
        content: "已生成但未发送的消息将保留。",
        onOk: () => {
          updateTaskStatus(row.id, "已暂停");
          Message.success("任务已暂停");
        },
      });
    if (key === "resume") {
      updateTaskStatus(row.id, "发送中");
      Message.success("任务已恢复发送");
    }
    if (key === "cancel")
      Modal.confirm({
        title: `取消任务 · ${row.name}`,
        content: "取消后不再生成或发送新实例，已送达消息无法撤回。",
        onOk: () => {
          updateTaskStatus(row.id, "已取消");
          Message.success("任务已取消");
        },
      });
  };

  const columns: TableColumnProps<MessageTask>[] = [
    {
      title: "任务",
      width: 240,
      render: (_, row) => (
        <div>
          <Typography.Text className="strong">{row.name}</Typography.Text>
          <div className="mono muted">{row.id}</div>
        </div>
      ),
    },
    {
      title: "触发方式 / 分类",
      width: 190,
      render: (_, row) => (
        <div>
          {row.triggerType === "event" ? "系统事件触发" : "人工发送"}
          <div className="muted">
            {row.category} · {row.nature}
          </div>
          {row.eventConfig && (
            <div className="mono muted">{row.eventConfig.eventId}</div>
          )}
        </div>
      ),
    },
    {
      title: "风险",
      width: 72,
      render: (_, row) => (
        <span
          className={`risk-${row.risk === "关键" ? "critical" : row.risk === "高" ? "high" : row.risk === "中" ? "medium" : "low"}`}
        >
          {row.risk}
        </span>
      ),
    },
    {
      title: "模板版本",
      dataIndex: "template",
      width: 170,
      render: (value) => <span className="mono">{value}</span>,
    },
    {
      title: "渠道",
      width: 190,
      render: (_, row) => (
        <div className="channel-list">
          {row.channels.map((c) => (
            <Tag key={c} color={channelColors[c]} bordered>
              {c}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "目标用户",
      width: 180,
      render: (_, row) => (
        <div>
          {row.audience}
          <div className="muted">{row.audienceCount.toLocaleString()} 人</div>
        </div>
      ),
    },
    { title: "计划时间", dataIndex: "schedule", width: 170 },
    {
      title: "状态",
      width: 118,
      render: (_, row) => (
        <div>
          <StatusTag status={row.status} />
          <div className="muted approval-copy">{row.approval}</div>
        </div>
      ),
    },
    {
      title: "进度",
      width: 120,
      render: (_, row) =>
        row.progress ? (
          <Progress percent={row.progress} size="small" showText={false} />
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      title: "创建人",
      width: 120,
      render: (_, row) => (
        <div>
          {row.creator}
          <div className="muted">{row.team}</div>
        </div>
      ),
    },
    {
      title: "操作",
      fixed: "right",
      width: 76,
      render: (_, row) => (
        <Dropdown
          trigger="click"
          droplist={
            <Menu onClickMenuItem={(key) => handleTaskAction(key, row)}>
              <Menu.Item key="view">查看详情</Menu.Item>
              <Menu.Item key="edit" disabled={!canEditTask(row.status)}>
                {row.status === "草稿" ? "继续编辑" : "再次编辑"}
              </Menu.Item>
              <Menu.Item key="copy">复制任务</Menu.Item>
              <Menu.Item key="pause" disabled={row.status !== "发送中"}>
                暂停发送
              </Menu.Item>
              <Menu.Item key="resume" disabled={row.status !== "已暂停"}>
                恢复发送
              </Menu.Item>
              <Menu.Item
                key="cancel"
                disabled={["已完成", "已取消"].includes(row.status)}
              >
                取消任务
              </Menu.Item>
            </Menu>
          }
        >
          <Button
            type="text"
            icon={<IconMore />}
            aria-label={`操作 ${row.name}`}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <section className="page-stack">
      <PageHeader
        title="消息任务"
        description="统一创建、审核和追踪人工群发与系统事件消息。"
        actions={
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => navigate("/tasks/create")}
          >
            新建消息任务
          </Button>
        }
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setStatus(undefined);
          setNature(undefined);
          setChannel(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          allowClear
          style={{ width: 280 }}
          placeholder="搜索任务 ID、名称或创建人"
        />
        <Select
          placeholder="任务状态"
          value={status}
          onChange={setStatus}
          allowClear
          style={{ width: 150 }}
        >
          {[
            "草稿",
            "待审核",
            "已驳回",
            "已启用",
            "待发送",
            "发送中",
            "已暂停",
            "已完成",
            "部分完成",
            "失败",
          ].map((item) => (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="消息性质"
          value={nature}
          onChange={setNature}
          allowClear
          style={{ width: 140 }}
        >
          {["事务", "服务", "营销"].map((item) => (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="发送渠道"
          value={channel}
          onChange={setChannel}
          allowClear
          style={{ width: 170 }}
        >
          {["站内信", "Push"].map((item) => (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          ))}
        </Select>
      </FilterBar>
      <ResourceTable data={filtered} columns={columns} rowKey="id" />
      <Drawer
        width={900}
        visible={Boolean(selected)}
        title={selected ? `任务详情 · ${selected.name}` : "任务详情"}
        onCancel={() => setSelected(undefined)}
        footer={<Button onClick={() => setSelected(undefined)}>关闭</Button>}
      >
        {selected && (
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Descriptions
              column={3}
              border
              data={[
                { label: "任务 ID", value: selected.id },
                {
                  label: "状态",
                  value: <StatusTag status={selected.status} />,
                },
                { label: "审批", value: selected.approval },
                {
                  label: "触发方式",
                  value:
                    selected.triggerType === "event"
                      ? "系统事件触发"
                      : "人工发送",
                },
                {
                  label: "内容来源",
                  value:
                    selected.contentMode === "temporary"
                      ? "临时消息"
                      : selected.template,
                },
                {
                  label: "模板版本",
                  value: selected.templateVersion || selected.template,
                },
                { label: "渠道", value: selected.channels.join(" + ") },
                {
                  label: "受众",
                  value: `${selected.audience} · ${selected.audienceCount.toLocaleString()} 人`,
                },
                { label: "发送时间", value: selected.schedule },
                { label: "有效期", value: selected.expiresAt || "未设置" },
                {
                  label: "翻译批次",
                  value: selected.translationBatchId || "源语言",
                },
                ...(selected.eventConfig
                  ? [
                      {
                        label: "事件编码",
                        value: selected.eventConfig.eventId,
                      },
                      {
                        label: "事件版本",
                        value: selected.eventConfig.eventVersion,
                      },
                      {
                        label: "触发条件",
                        value:
                          selected.eventConfig.conditionExpression ||
                          "事件到达即触发",
                      },
                      {
                        label: "去重键",
                        value: selected.eventConfig.dedupeKey,
                      },
                      {
                        label: "事件有效期",
                        value: `${selected.eventConfig.eventTtlSeconds} 秒`,
                      },
                      {
                        label: "重试策略",
                        value: `最多 ${selected.eventConfig.maxRetries} 次 · 首次退避 ${selected.eventConfig.retryBackoffSeconds} 秒`,
                      },
                      {
                        label: "变量映射",
                        value: selected.eventConfig.variableMappings
                          .map(
                            (item) =>
                              `${item.eventField} → ${item.templateVariable}`,
                          )
                          .join("；"),
                      },
                    ]
                  : []),
              ]}
            />
            {selected.content && <MessagePreview content={selected.content} />}
            <div className="approval-samples">
              <strong>受众样例</strong>
              {selected.sampleUsers?.map((user) => (
                <Tag key={user}>{user}</Tag>
              ))}
            </div>
          </Space>
        )}
      </Drawer>
    </section>
  );
}
