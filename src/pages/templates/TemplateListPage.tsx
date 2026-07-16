import { useState } from "react";
import {
  Button,
  Drawer,
  Input,
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
import type { MessageTemplate, TranslationBatch } from "../../domain/types";
import TranslationWorkflowPanel from "./TranslationWorkflowPanel";
import TemplateEditorDrawer from "./TemplateEditorDrawer";
import { usePrototypeStore } from "../../store/prototypeStore";
import MultilingualProgressCell from "../multilingual/MultilingualProgressCell";
import MultilingualProgressDrawer from "../multilingual/MultilingualProgressDrawer";
import { useSearchParams } from "react-router-dom";
import { templateSupportsScope } from "./templateScope";
import { isApprovedManualTemplateLocked } from "../../domain/templatePolicy";

export default function TemplateListPage() {
  const [searchParams] = useSearchParams();
  const entryScope = searchParams.get("scope") === "event" ? "event" : "manual";
  const pageTitle = entryScope === "event" ? "事件消息模板" : "人工消息模板";
  const [preview, setPreview] = useState<MessageTemplate>();
  const [usageTemplate, setUsageTemplate] = useState<MessageTemplate>();
  const [editing, setEditing] = useState<MessageTemplate | "new">();
  const [progressBatch, setProgressBatch] = useState<TranslationBatch>();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [nature, setNature] = useState<string>();
  const [channel, setChannel] = useState<string>();
  const store = usePrototypeStore();
  const usageFor = (template: MessageTemplate) =>
    store.tasks.filter(
      (task) =>
        task.templateId === template.id ||
        task.template === `${template.code} ${template.version}`,
    );
  const data = store.templates.filter(
    (item) =>
      item.owner !== "临时任务" &&
      templateSupportsScope(item, entryScope) &&
      `${item.id}${item.code}${item.name}`
        .toLowerCase()
        .includes(keyword.toLowerCase()) &&
      (!status || item.status === status) &&
      (!nature || item.nature === nature) &&
      (!channel ||
        item.channels.includes(channel as MessageTemplate["channels"][number])),
  );
  const columns: TableColumnProps<MessageTemplate>[] = [
    {
      title: "模板",
      width: 240,
      render: (_, r) => (
        <div>
          <Typography.Text className="strong">{r.name}</Typography.Text>
          <div className="mono muted">{r.code}</div>
        </div>
      ),
    },
    {
      title: "分类 / 性质",
      width: 150,
      render: (_, r) => (
        <div>
          {r.category}
          <div className="muted">{r.nature}</div>
        </div>
      ),
    },
    { title: "风险", dataIndex: "risk", width: 80 },
    {
      title: "渠道",
      width: 200,
      render: (_, r) => (
        <Space wrap>
          {r.channels.map((c) => (
            <Tag key={c}>{c}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "语言覆盖",
      width: 190,
      render: (_, r) => (
        <div>
          {r.locales.slice(0, 3).join(" · ")}
          {r.locales.length > 3 && ` +${r.locales.length - 3}`}
          <div className="muted">默认 {r.sourceLocale}</div>
        </div>
      ),
    },
    {
      title: "多语言流程",
      width: 250,
      render: (_, r) => {
        const batch = store.translationBatches.find(
          (item) => item.id === r.translationBatchId,
        );
        return (
          <MultilingualProgressCell
            batch={batch}
            onOpen={() => setProgressBatch(batch)}
          />
        );
      },
    },
    { title: "版本", dataIndex: "version", width: 70 },
    {
      title: "适用场景",
      width: 100,
      render: (_, template) => (
        <Tag color={template.usageScope === "shared" ? "green" : "arcoblue"}>
          {template.usageScope === "manual"
            ? "人工消息"
            : template.usageScope === "event"
              ? "事件通知"
              : "通用"}
        </Tag>
      ),
    },
    {
      title: "使用任务",
      width: 160,
      render: (_, template) => {
        const usage = usageFor(template);
        const eventCount = usage.filter(
          (task) => task.triggerType === "event",
        ).length;
        return (
          <Button type="text" onClick={() => setUsageTemplate(template)}>
            人工 {usage.length - eventCount} · 事件 {eventCount}
          </Button>
        );
      },
    },
    {
      title: "状态",
      width: 100,
      render: (_, r) => <StatusTag status={r.status} />,
    },
    { title: "更新时间", dataIndex: "updatedAt", width: 120 },
    {
      title: "操作",
      fixed: "right",
      width: 220,
      render: (_, r) => {
        const locked = isApprovedManualTemplateLocked(r);
        return (
          <Space>
            <Button type="text" onClick={() => setEditing(r)}>
              {locked ? "查看详情" : "编辑"}
            </Button>
            <Button type="text" onClick={() => setPreview(r)}>
              多语言流程
            </Button>
          </Space>
        );
      },
    },
  ];
  return (
    <section className="page-stack">
      <PageHeader
        title={pageTitle}
        description={
          entryScope === "event"
            ? "维护事件通知专用与通用模板，共享版本、多语言、预览和审核能力。"
            : "维护人工消息专用与通用模板，共享版本、多语言、预览和审核能力。"
        }
        actions={
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => setEditing("new")}
          >
            新建{pageTitle}
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
          placeholder="搜索模板 ID、编码或名称"
          style={{ width: 280 }}
        />
        <Select
          placeholder="消息性质"
          value={nature}
          onChange={setNature}
          style={{ width: 140 }}
          allowClear
          options={["事务", "服务", "营销"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <Select
          placeholder="渠道"
          value={channel}
          onChange={setChannel}
          style={{ width: 140 }}
          allowClear
          options={["站内信", "Push"].map((value) => ({ label: value, value }))}
        />
        <Select
          placeholder="状态"
          value={status}
          onChange={setStatus}
          style={{ width: 140 }}
          allowClear
          options={["草稿", "审核中", "待业务审核", "已发布", "已停用"].map(
            (value) => ({ label: value, value }),
          )}
        />
      </FilterBar>
      <ResourceTable data={data} columns={columns} rowKey="id" />
      <Drawer
        width={820}
        title={
          preview
            ? `${preview.name} · ${preview.version} · 多语言生产`
            : "多语言生产"
        }
        visible={Boolean(preview)}
        onCancel={() => setPreview(undefined)}
        footer={null}
      >
        {preview && (
          <TranslationWorkflowPanel
            template={
              store.templates.find((item) => item.id === preview.id) || preview
            }
            batch={store.translationBatches.find(
              (batch) =>
                batch.id ===
                (store.templates.find((item) => item.id === preview.id)
                  ?.translationBatchId || preview.translationBatchId),
            )}
            onEdit={() => {
              setPreview(undefined);
              setEditing(
                store.templates.find((item) => item.id === preview.id) ||
                  preview,
              );
            }}
          />
        )}
      </Drawer>
      <Drawer
        width={720}
        title={
          usageTemplate
            ? `${usageTemplate.name} · ${usageTemplate.version} · 使用任务`
            : "使用任务"
        }
        visible={Boolean(usageTemplate)}
        onCancel={() => setUsageTemplate(undefined)}
        footer={
          <Button onClick={() => setUsageTemplate(undefined)}>关闭</Button>
        }
      >
        {usageTemplate && (
          <Space direction="vertical" style={{ width: "100%" }}>
            {usageFor(usageTemplate).length ? (
              usageFor(usageTemplate).map((task) => (
                <div className="template-usage-row" key={task.id}>
                  <div>
                    <Typography.Text className="strong">
                      {task.name}
                    </Typography.Text>
                    <div className="mono muted">{task.id}</div>
                  </div>
                  <Tag
                    color={task.triggerType === "event" ? "purple" : "arcoblue"}
                  >
                    {task.triggerType === "event" ? "系统事件触发" : "人工发送"}
                  </Tag>
                  {task.eventConfig && (
                    <span className="mono">{task.eventConfig.eventId}</span>
                  )}
                  <StatusTag status={task.status} />
                </div>
              ))
            ) : (
              <div className="empty-state">当前模板版本尚未被任务使用</div>
            )}
          </Space>
        )}
      </Drawer>
      <TemplateEditorDrawer
        visible={Boolean(editing)}
        template={editing === "new" ? undefined : editing}
        entryScope={entryScope}
        onClose={() => setEditing(undefined)}
        onCreated={(item) => setPreview(item)}
      />
      <MultilingualProgressDrawer
        batch={progressBatch}
        visible={Boolean(progressBatch)}
        onClose={() => setProgressBatch(undefined)}
      />
    </section>
  );
}
