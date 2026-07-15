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
import type { ManualTaskOperation, MessageTask, TranslationBatch } from "../../domain/types";
import MessagePreview from "../../components/MessagePreview";
import {
  performManualTaskOperation,
  usePrototypeStore,
} from "../../store/prototypeStore";
import {
  MANUAL_TASK_STATUSES,
  canEditManualTask,
  getManualTaskOperations,
  isManualTaskStatus,
} from "./taskLifecycle";
import MultilingualProgressCell from "../multilingual/MultilingualProgressCell";
import MultilingualProgressDrawer from "../multilingual/MultilingualProgressDrawer";

const channelColors: Record<string, string> = {
  站内信: "arcoblue",
  Push: "purple",
};
export const canEditTask = (status: string) =>
  isManualTaskStatus(status) && canEditManualTask(status);

export default function TaskListPage() {
  const navigate = useNavigate();
  const store = usePrototypeStore();
  const tasks = store.tasks.filter((task) => task.triggerType !== "event");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [nature, setNature] = useState<string>();
  const [channel, setChannel] = useState<string>();
  const [selected, setSelected] = useState<MessageTask>();
  const [progressBatch, setProgressBatch] = useState<TranslationBatch>();
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

  const operationsFor = (row: MessageTask): ManualTaskOperation[] =>
    !isManualTaskStatus(row.status)
      ? ["查看详情", "复制任务"]
      : getManualTaskOperations({
          status: row.status,
          deliveryResult: row.deliveryResult,
        });

  const handleTaskAction = (operation: string, row: MessageTask) => {
    if (operation === "查看详情") setSelected(row);
    if (operation === "复制任务") {
      Message.info(`正在复制「${row.name}」的内容、受众与发送配置`);
      navigate("/tasks/create", { state: { copyTask: row } });
    }
    if (
      operation === "编辑任务" &&
      canEditTask(row.status)
    ) {
      const openEditor = () =>
        navigate("/tasks/create", { state: { copyTask: row, resume: true } });
      if (row.status === "待发送")
        Modal.confirm({
          title: `编辑任务 · ${row.name}`,
          content: "编辑后原审批结果失效，保存后任务回到草稿。",
          okText: "继续编辑",
          onOk: openEditor,
        });
      else openEditor();
    }
    if (operation === "撤回审核")
      Modal.confirm({
        title: `撤回审核 · ${row.name}`,
        content: "撤回后任务回到草稿，当前审批实例立即失效。",
        okText: "确认撤回",
        onOk: () => {
          performManualTaskOperation(row.id, "撤回审核");
          Message.success("审核已撤回，任务已回到草稿");
        },
      });
    if (operation === "暂停发送")
      Modal.confirm({
        title: `暂停发送 · ${row.name}`,
        content: "已生成但未发送的消息将保留。",
        okText: "确认暂停",
        onOk: () => {
          performManualTaskOperation(row.id, "暂停发送");
          Message.success("任务已暂停");
        },
      });
    if (operation === "恢复发送") {
      performManualTaskOperation(row.id, "恢复发送");
      Message.success("任务已恢复发送");
    }
    if (operation === "取消任务")
      Modal.confirm({
        title: `取消任务 · ${row.name}`,
        content: "取消后不再生成或发送新实例，已送达消息无法撤回。",
        okText: "确认取消",
        onOk: () => {
          performManualTaskOperation(row.id, "取消任务");
          Message.success("任务已取消");
        },
      });
    if (operation === "重试失败项") {
      Message.info(`正在基于「${row.name}」创建失败项重试任务`);
      navigate("/tasks/create", {
        state: { copyTask: row, retryFailed: true },
      });
    }
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
          人工发送
          <div className="muted">
            {row.category} · {row.nature}
          </div>
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
      title: "任务状态",
      width: 104,
      render: (_, row) => <StatusTag status={row.status} />,
    },
    {
      title: "审核状态",
      width: 104,
      render: (_, row) => (
        <StatusTag
          status={
            row.approvalStatus ||
            (row.approval.includes("通过") ? "通过" : row.approval)
          }
        />
      ),
    },
    {
      title: "发送结果",
      width: 104,
      render: (_, row) =>
        <StatusTag status={row.deliveryResult || "未开始"} />,
    },
    {
      title: "多语言流程",
      width: 250,
      render: (_, row) => {
        const batch = store.translationBatches.find(
          (item) => item.id === row.translationBatchId,
        );
        return (
          <MultilingualProgressCell
            batch={batch}
            onOpen={() => setProgressBatch(batch)}
          />
        );
      },
    },
    {
      title: "发送进度",
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
              {operationsFor(row).map((operation) => (
                <Menu.Item key={operation}>{operation}</Menu.Item>
              ))}
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
        title="人工消息任务"
        description="创建、审核和追踪一次性人工发送任务；事件自动通知在事件通知规则中管理。"
        actions={
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => navigate("/tasks/create")}
          >
            新建人工消息任务
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
          {MANUAL_TASK_STATUSES.map((item) => (
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
                  label: "任务状态",
                  value: <StatusTag status={selected.status} />,
                },
                {
                  label: "审核状态",
                  value: (
                    <StatusTag
                      status={
                        selected.approvalStatus ||
                        (selected.approval.includes("通过")
                          ? "通过"
                          : selected.approval)
                      }
                    />
                  ),
                },
                {
                  label: "发送结果",
                  value:
                    selected.triggerType === "event" ? (
                      "查看发送记录"
                    ) : (
                      <StatusTag
                        status={selected.deliveryResult || "未开始"}
                      />
                    ),
                },
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
      <MultilingualProgressDrawer
        batch={progressBatch}
        visible={Boolean(progressBatch)}
        onClose={() => setProgressBatch(undefined)}
      />
    </section>
  );
}
