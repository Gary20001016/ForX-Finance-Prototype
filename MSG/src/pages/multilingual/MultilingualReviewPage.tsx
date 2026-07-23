import { useMemo, useState } from "react";
import { Button, Input, Select, Tabs, Tag, Typography } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import type { TranslationItem, TranslationSubjectType } from "../../domain/types";
import {
  CURRENT_REVIEW_OPERATOR_ID,
  reviewOperatorName,
} from "../../domain/reviewOperators";
import {
  canReviewTranslation,
  startSpecialReview,
  usePrototypeStore,
} from "../../store/prototypeStore";
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
  const [selected, setSelected] = useState<TranslationItem>();
  const [tab, setTab] = useState("mine");
  const data = useMemo(
    () =>
      store.translationBatches
        .flatMap((batch) => batch.items)
        .filter(
          (item) =>
            item.specialReviewRequired &&
            (tab === "all" ||
              (item.status === "翻译返回待审核" &&
                item.assigneeId === CURRENT_REVIEW_OPERATOR_ID)) &&
            `${item.subjectName || item.templateName}${item.targetLocale}${item.externalTaskId || ""}`
              .toLowerCase()
              .includes(keyword.toLowerCase()) &&
            (!source || item.subjectType === source) &&
            (!locale || item.targetLocale === locale),
        ),
    [keyword, locale, source, store.translationBatches, tab],
  );
  const mineCount = useMemo(
    () =>
      store.translationBatches
        .flatMap((batch) => batch.items)
        .filter(
          (item) =>
            item.specialReviewRequired &&
            item.status === "翻译返回待审核" &&
            item.assigneeId === CURRENT_REVIEW_OPERATOR_ID,
        ).length,
    [store.translationBatches],
  );
  const allCount = useMemo(
    () =>
      store.translationBatches
        .flatMap((batch) => batch.items)
        .filter((item) => item.specialReviewRequired).length,
    [store.translationBatches],
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
    {
      title: "指派审核人",
      width: 180,
      render: (_, item) => (
        <div>
          {item.assignee || reviewOperatorName(item.assigneeId)}
          <div className="mono muted">{item.assigneeId || "—"}</div>
        </div>
      ),
    },
    {
      title: "内容生产方式",
      width: 180,
      render: (_, item) =>
        item.productionMode === "direct_source_review" ? (
          <Tag color="arcoblue">单语言原文</Tag>
        ) : (
          <span className="mono">{item.externalTaskId}</span>
        ),
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
      render: (_, item) =>
        item.productionMode === "direct_source_review" &&
        item.status === "翻译返回待审核" ? (
          <Tag color="orange">原文待审核</Tag>
        ) : (
          <StatusTag status={item.status} />
        ),
    },
    {
      title: "操作",
      fixed: "right",
      width: 130,
      render: (_, item) => (
        <Button
          type="text"
          onClick={() => {
            if (canReviewTranslation(item, CURRENT_REVIEW_OPERATOR_ID)) {
              startSpecialReview(item.id);
            }
            setSelected(item);
          }}
        >
          {canReviewTranslation(item, CURRENT_REVIEW_OPERATOR_ID)
            ? item.productionMode === "direct_source_review"
              ? "审核原文"
              : "审核译文"
            : "查看详情"}
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
      <Tabs activeTab={tab} onChange={setTab}>
        <Tabs.TabPane key="mine" title={`待我审核 (${mineCount})`} />
        <Tabs.TabPane key="all" title={`全部工单 (${allCount})`} />
      </Tabs>
      <FilterBar
        onReset={() => {
          setKeyword("");
          setSource(undefined);
          setLocale(undefined);
        }}
      >
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索来源名称、语言或外部任务 ID"
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
      </FilterBar>
      <ResourceTable data={data} columns={columns} rowKey="id" />
      <TranslationReviewDrawer
        item={selected}
        visible={Boolean(selected)}
        onClose={() => setSelected(undefined)}
        currentAdmin={CURRENT_REVIEW_OPERATOR_ID}
        reviewMode="special"
      />
    </section>
  );
}
