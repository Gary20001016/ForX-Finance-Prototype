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
import {
  isReusableMessageTemplate,
  templateSupportsScope,
} from "./templateScope";
import { isPublishedTemplateLocked } from "../../domain/templatePolicy";
import { MANUAL_TEMPLATE_STATUSES } from "../../domain/manualTemplateStatus";
import {
  formatDisplayLocation,
  getTopicsForCategory,
  MESSAGE_DISPLAY_CATEGORIES,
} from "../../domain/messageDisplayTaxonomy";
import type {
  MessageCategoryCode,
  MessageTopicCode,
} from "../../domain/types";
import WritePermissionButton from "../../components/WritePermissionButton";
import { useCurrentPagePermission } from "../../components/PagePermissionBoundary";
import { contentWorkflowStageLabel } from "../../domain/contentApprovalWorkflow";

export default function TemplateListPage() {
  const { canWrite } = useCurrentPagePermission();
  const [searchParams] = useSearchParams();
  const entryScope = searchParams.get("scope") === "event" ? "event" : "manual";
  const pageTitle = entryScope === "event" ? "事件消息模板" : "人工消息模板";
  const [preview, setPreview] = useState<MessageTemplate>();
  const [usageTemplate, setUsageTemplate] = useState<MessageTemplate>();
  const [editing, setEditing] = useState<MessageTemplate | "new">();
  const [progressBatch, setProgressBatch] = useState<TranslationBatch>();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [category, setCategory] = useState<MessageCategoryCode>();
  const [topic, setTopic] = useState<MessageTopicCode>();
  const [channel, setChannel] = useState<string>();
  const store = usePrototypeStore();
  const taskUsageFor = (template: MessageTemplate) =>
    store.tasks.filter((task) => {
      const matchesTemplate =
        task.templateId === template.id ||
        task.template === `${template.code} ${template.version}`;
      const matchesEntry =
        entryScope === "event"
          ? task.triggerType === "event"
          : task.triggerType !== "event";
      return matchesTemplate && matchesEntry;
    });
  const eventRuleUsageFor = (template: MessageTemplate) => {
    const relatedRuleIds = new Set(
      store.ruleVersions
        .filter((version) => version.templateId === template.id)
        .map((version) => version.ruleId),
    );
    return store.rules.filter((rule) => relatedRuleIds.has(rule.id));
  };
  const data = store.templates.filter(
    (item) =>
      isReusableMessageTemplate(item) &&
      (entryScope === "event"
        ? item.usageScope === "event"
        : templateSupportsScope(item, entryScope)) &&
      `${item.id}${item.code}${item.name}`
        .toLowerCase()
        .includes(keyword.toLowerCase()) &&
      (!status || item.status === status) &&
      (!category || item.category === category) &&
      (!topic || item.topic === topic) &&
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
          <div className="mono muted">{r.id}</div>
        </div>
      ),
    },
    ...(entryScope === "event"
      ? [
          {
            title: "系统事件",
            width: 220,
            render: (_: unknown, template: MessageTemplate) => {
              const event = store.events.find(
                (item) => item.id === template.eventId,
              );
              return (
                <div>
                  <Typography.Text className="strong">
                    {event?.name || "未绑定事件"}
                  </Typography.Text>
                  <div className="mono muted">{template.eventId || "—"}</div>
                </div>
              );
            },
          },
        ]
      : []),
    {
      title: "展示位置",
      width: 180,
      render: (_, r) => (
        <Typography.Text>
          {formatDisplayLocation(r.category, r.topic)}
        </Typography.Text>
      ),
    },
    { title: "风险", dataIndex: "risk", width: 80 },
    ...(entryScope === "event"
      ? [
          {
            title: "所有者团队",
            dataIndex: "owner",
            width: 120,
            render: (owner: string | undefined) => owner || "—",
          },
        ]
      : []),
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
      title: "当前节点",
      width: 140,
      render: (_, r) => contentWorkflowStageLabel(r.workflowStage),
    },
    {
      title: "内容审核",
      width: 110,
      render: (_, r) => (
        <StatusTag status={r.contentApprovalStatus || "未提交"} />
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
    ...(entryScope === "event"
      ? [
          {
            title: "适用场景",
            width: 100,
            render: (_: unknown, template: MessageTemplate) => (
              <Tag
                color={
                  template.usageScope === "shared" ? "green" : "arcoblue"
                }
              >
                {template.usageScope === "event" ? "事件通知" : "通用"}
              </Tag>
            ),
          },
        ]
      : []),
    entryScope === "event"
      ? {
          title: "关联通知规则",
          width: 160,
          render: (_: unknown, template: MessageTemplate) => (
            <Button type="text" onClick={() => setUsageTemplate(template)}>
              {eventRuleUsageFor(template).length} 条规则
            </Button>
          ),
        }
      : {
          title: "使用任务",
          width: 160,
          render: (_: unknown, template: MessageTemplate) => (
            <Button type="text" onClick={() => setUsageTemplate(template)}>
              {taskUsageFor(template).length} 个任务
            </Button>
          ),
        },
    {
      title: "状态",
      width: 100,
      render: (_, r) => <StatusTag status={r.status} />,
    },
    entryScope === "manual"
      ? {
          title: "发布时间",
          width: 120,
          render: (_, template) =>
            template.status === "已发布" ? template.updatedAt : "—",
        }
      : { title: "更新时间", dataIndex: "updatedAt", width: 120 },
    {
      title: "操作",
      fixed: "right",
      width: 220,
      render: (_, r) => {
        const locked = isPublishedTemplateLocked(r);
        return (
          <Space>
            {locked || !canWrite ? (
              <Button type="text" onClick={() => setEditing(r)}>查看详情</Button>
            ) : (
              <WritePermissionButton type="text" onClick={() => setEditing(r)}>编辑</WritePermissionButton>
            )}
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
            ? "仅维护事件目录相关的事件通知模板，共享多语言、预览和审核能力。"
            : "维护人工消息专用与通用模板，共享多语言、预览和审核能力。"
        }
        actions={
          <WritePermissionButton
            type="primary"
            icon={<IconPlus />}
            onClick={() => setEditing("new")}
          >
            新建{pageTitle}
          </WritePermissionButton>
        }
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setStatus(undefined);
          setCategory(undefined);
          setTopic(undefined);
          setChannel(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索模板编号或名称"
          style={{ width: 280 }}
        />
        <Select
          placeholder="一级分类"
          value={category}
          onChange={(value) => {
            setCategory(value);
            setTopic(undefined);
          }}
          style={{ width: 140 }}
          allowClear
          options={MESSAGE_DISPLAY_CATEGORIES.map((item) => ({
            label: item.name,
            value: item.code,
          }))}
        />
        <Select
          placeholder="二级主题"
          value={topic}
          onChange={setTopic}
          style={{ width: 140 }}
          allowClear
          disabled={!category}
          options={(category ? getTopicsForCategory(category) : []).map(
            (item) => ({
              label: item.name,
              value: item.code,
            }),
          )}
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
          options={(entryScope === "manual"
            ? MANUAL_TEMPLATE_STATUSES
            : ["草稿", "审核中", "驳回", "已发布"]
          ).map((value) => ({ label: value, value }))}
        />
      </FilterBar>
      <ResourceTable data={data} columns={columns} rowKey="id" />
      <Drawer
        width={820}
        title={
          preview
            ? `${preview.name} · 多语言生产`
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
              const currentTemplate =
                store.templates.find((item) => item.id === preview.id) ||
                preview;
              if (isPublishedTemplateLocked(currentTemplate)) return;
              setPreview(undefined);
              setEditing(currentTemplate);
            }}
            readOnly={!canWrite || isPublishedTemplateLocked(preview)}
          />
        )}
      </Drawer>
      <Drawer
        width={720}
        title={
          usageTemplate
            ? entryScope === "event"
              ? `${usageTemplate.name} · 关联通知规则`
              : `${usageTemplate.name} · 使用任务`
            : entryScope === "event"
              ? "关联通知规则"
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
            {entryScope === "event" ? (
              eventRuleUsageFor(usageTemplate).length ? (
                eventRuleUsageFor(usageTemplate).map((rule) => {
                  const event = store.events.find(
                    (item) => item.id === rule.eventId,
                  );
                  return (
                    <div className="template-usage-row" key={rule.id}>
                      <div>
                        <Typography.Text className="strong">
                          {rule.name}
                        </Typography.Text>
                        <div className="mono muted">{rule.id}</div>
                      </div>
                      <Tag color="purple">事件通知规则</Tag>
                      <span>
                        {event?.name || rule.eventId}
                        <div className="mono muted">{rule.eventId}</div>
                      </span>
                      <StatusTag status={rule.status} />
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">当前模板尚未关联通知规则</div>
              )
            ) : taskUsageFor(usageTemplate).length ? (
              taskUsageFor(usageTemplate).map((task) => (
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
              <div className="empty-state">当前模板尚未被任务使用</div>
            )}
          </Space>
        )}
      </Drawer>
      <TemplateEditorDrawer
        visible={Boolean(editing)}
        template={editing === "new" ? undefined : editing}
        entryScope={entryScope}
        readOnly={
          !canWrite ||
          (editing !== "new" &&
            Boolean(editing && isPublishedTemplateLocked(editing)))
        }
        onClose={() => setEditing(undefined)}
        onCreated={(item) => setPreview(item)}
      />
      <MultilingualProgressDrawer
        batch={progressBatch}
        visible={Boolean(progressBatch)}
        readOnly={!canWrite}
        onClose={() => setProgressBatch(undefined)}
      />
    </section>
  );
}
