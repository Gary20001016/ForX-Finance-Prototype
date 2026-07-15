import { useMemo, useState } from "react";
import { Button, Input, Select, Space, Tag, Typography } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import type { TranslationItem, TranslationSubjectType } from "../../domain/types";
import { startSpecialReview, usePrototypeStore } from "../../store/prototypeStore";
import TranslationReviewDrawer from "../approvals/TranslationReviewDrawer";
import { localeName } from "./MultilingualProgressCell";

const subjectLabel: Record<TranslationSubjectType, string> = {
  template_version: "消息模板版本",
  manual_task_content: "人工任务临时内容",
  rule_content_version: "事件规则内容版本",
};

export default function MultilingualReviewPage() {
  const store = usePrototypeStore();
  const [keyword, setKeyword] = useState("");
  const [source, setSource] = useState<string>();
  const [locale, setLocale] = useState<string>();
  const [group, setGroup] = useState<string>();
  const [selected, setSelected] = useState<TranslationItem>();
  const pendingStatuses = new Set(["待小语种专审", "专审中", "审核驳回", "待人工审核"]);
  const data = useMemo(
    () =>
      store.translationBatches
        .flatMap((batch) => batch.items)
        .filter(
          (item) =>
            item.specialReviewRequired &&
            pendingStatuses.has(item.status) &&
            `${item.subjectName || item.templateName}${item.targetLocale}${item.externalTaskId}`
              .toLowerCase()
              .includes(keyword.toLowerCase()) &&
            (!source || item.subjectType === source) &&
            (!locale || item.targetLocale === locale) &&
            (!group || item.reviewGroup === group),
        ),
    [group, keyword, locale, source, store.translationBatches],
  );

  const columns: TableColumnProps<TranslationItem>[] = [
    {
      title: "来源对象",
      width: 260,
      render: (_, item) => (
        <div>
          <Typography.Text className="strong">
            {item.subjectName || item.templateName}
          </Typography.Text>
          <div className="muted">
            {subjectLabel[item.subjectType || "template_version"]}
          </div>
        </div>
      ),
    },
    {
      title: "目标语言",
      width: 130,
      render: (_, item) => (
        <div>
          {localeName[item.targetLocale] || item.targetLocale}
          <div className="mono muted">{item.targetLocale}</div>
        </div>
      ),
    },
    { title: "审核组", dataIndex: "reviewGroup", width: 170 },
    {
      title: "审核 SLA",
      width: 100,
      render: (_, item) => `${item.reviewSlaHours || "—"} 小时`,
    },
    {
      title: "外部机翻任务",
      width: 180,
      render: (_, item) => <span className="mono">{item.externalTaskId}</span>,
    },
    {
      title: "变量检查",
      width: 100,
      render: (_, item) => (
        <Tag color={item.variablesValid ? "green" : "red"}>
          {item.variablesValid ? "通过" : "失败"}
        </Tag>
      ),
    },
    {
      title: "状态",
      width: 130,
      render: (_, item) => <StatusTag status={item.status} />,
    },
    {
      title: "操作",
      fixed: "right",
      width: 130,
      render: (_, item) => (
        <Button
          type="text"
          onClick={() => {
            startSpecialReview(item.id);
            setSelected(item);
          }}
        >
          {item.status === "专审中" ? "继续专项审核" : "开始专项审核"}
        </Button>
      ),
    },
  ];

  return (
    <section className="page-stack">
      <PageHeader
        title="多语言审核"
        description="集中处理需要语言专家复核的小语种；普通语言仍在模板、临时消息或规则内容页当场校对。"
      />
      <FilterBar
        onReset={() => {
          setKeyword("");
          setSource(undefined);
          setLocale(undefined);
          setGroup(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索来源名称或外部任务 ID"
          style={{ width: 280 }}
        />
        <Select
          value={source}
          onChange={setSource}
          allowClear
          placeholder="来源类型"
          style={{ width: 180 }}
          options={Object.entries(subjectLabel).map(([value, label]) => ({ value, label }))}
        />
        <Select
          value={locale}
          onChange={setLocale}
          allowClear
          placeholder="目标语言"
          style={{ width: 150 }}
          options={store.languageReviewPolicies
            .filter((policy) => policy.specialReviewRequired)
            .map((policy) => ({ value: policy.localeCode, label: policy.localeName }))}
        />
        <Select
          value={group}
          onChange={setGroup}
          allowClear
          placeholder="审核组"
          style={{ width: 190 }}
          options={Array.from(
            new Set(
              store.languageReviewPolicies
                .filter((policy) => policy.reviewGroup)
                .map((policy) => policy.reviewGroup!),
            ),
          ).map((value) => ({ value, label: value }))}
        />
      </FilterBar>
      <ResourceTable data={data} columns={columns} rowKey="id" />
      <TranslationReviewDrawer
        item={selected}
        visible={Boolean(selected)}
        onClose={() => setSelected(undefined)}
        currentAdmin="special-reviewer-02"
        reviewMode="special"
      />
    </section>
  );
}
