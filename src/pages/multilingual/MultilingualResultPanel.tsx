import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Input, Message, Space, Tag } from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";
import type {
  TranslationBatch,
  TranslationContentLayer,
  TranslationItem,
} from "../../domain/types";
import {
  approveOrdinaryTranslation,
  saveTranslationDraft,
  usePrototypeStore,
} from "../../store/prototypeStore";
import { haveSameVariableOccurrences } from "../../domain/manualMessageVariables";

const hasContent = (content?: TranslationContentLayer) =>
  Boolean(content?.title || content?.summary || content?.body);

const fallbackLayer = (
  primary: TranslationContentLayer | undefined,
  fallback: TranslationContentLayer,
): TranslationContentLayer => (hasContent(primary) ? primary! : fallback);

function ReadonlyContent({ content }: { content: TranslationContentLayer }) {
  return (
    <div className="multilingual-result-fields">
      <label>标题<div>{content.title || "—"}</div></label>
      <label>摘要<div>{content.summary || "—"}</div></label>
      <label>正文<div className="multilingual-result-body">{content.body || "—"}</div></label>
    </div>
  );
}

export default function MultilingualResultPanel({
  batch,
  item,
}: {
  batch: TranslationBatch;
  item: TranslationItem;
}) {
  const navigate = useNavigate();
  const store = usePrototypeStore();
  const template = store.templates.find((candidate) => candidate.id === item.templateId);
  const directSource =
    batch.productionMode === "direct_source_review" ||
    item.productionMode === "direct_source_review";
  const sourceContent = fallbackLayer(batch.sourceContent, {
    title: template?.content?.web.title || item.subjectName || item.templateName,
    summary: template?.content?.web.summary || "",
    body: template?.content?.web.body || "",
  });
  const machineContent: TranslationContentLayer = item.machineOutput || {
    title: item.machineTitle,
    summary: item.machineSummary,
    body: item.machineBody,
  };
  const reviewedContent = useMemo<TranslationContentLayer | undefined>(() => {
    if (!item.reviewedTitle && !item.reviewedSummary && !item.reviewedBody) return undefined;
    return {
      title: item.reviewedTitle,
      summary: item.reviewedSummary,
      body: item.reviewedBody,
    };
  }, [item.reviewedBody, item.reviewedSummary, item.reviewedTitle]);
  const currentContent = fallbackLayer(
    item.approvedOutput || reviewedContent || item.humanDraft,
    machineContent,
  );
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    setTitle(currentContent.title || "");
    setSummary(currentContent.summary || "");
    setBody(currentContent.body || "");
  }, [currentContent.body, currentContent.summary, currentContent.title, item.id]);

  const canEdit =
    !item.specialReviewRequired && item.status === "翻译返回待审核";
  const canEnterSpecialReview =
    item.specialReviewRequired && item.status === "翻译返回待审核";
  const machineResultReady = directSource
    ? hasContent(sourceContent) || hasContent(item.humanDraft)
    : hasContent(machineContent);

  if (!machineResultReady) {
    return (
      <div className="multilingual-result-panel">
        <Alert
          type={item.errorMessage ? "error" : "info"}
          showIcon
          title={directSource ? "暂无可查看的原文" : "暂无可查看的译文"}
          content={
            directSource
              ? "尚未提交单语言原文"
              : item.errorMessage
              ? `${item.errorCode || "TRANSLATION_FAILED"} · ${item.errorMessage || "外部机翻任务失败"}`
              : "外部机器翻译尚未返回结果"
          }
        />
      </div>
    );
  }

  const save = () => {
    saveTranslationDraft(item.id, { title, summary, body });
    Message.success(`${item.targetLocale} 人工修订草稿已保存`);
  };
  const approve = () => {
    if (!item.variablesValid) {
      Message.error("模板变量校验失败，禁止通过");
      return;
    }
    if (
      !haveSameVariableOccurrences(
        [sourceContent.title, sourceContent.summary, sourceContent.body]
          .filter(Boolean)
          .join("\n"),
        [title, summary, body].filter(Boolean).join("\n"),
      )
    ) {
      Message.error("人工修订不能修改或遗漏模板变量");
      return;
    }
    approveOrdinaryTranslation(item.id, {
      title,
      summary,
      body,
      reviewer: "Gary Ma",
    });
    Message.success(`${item.targetLocale} 修订结果已通过`);
  };

  return (
    <div className="multilingual-result-panel">
      <div className="multilingual-result-meta">
        <Space wrap>
          <Tag color="arcoblue">
            {directSource
              ? `${batch.sourceLocale} · 单语言直接编写`
              : `${batch.sourceLocale} → ${item.targetLocale}`}
          </Tag>
          <Tag color={item.variablesValid ? "green" : "red"}>
            变量检查 · {item.variablesValid ? "通过" : "失败"}
          </Tag>
          {item.specialReviewRequired && <Tag color="purple">小语种专项审核</Tag>}
        </Space>
        <span>
          {directSource
            ? `原文提交：${item.submittedAt || "—"}`
            : `机翻完成：${item.translatedAt || "—"}`} · 审核：{item.reviewer || "未审核"}
          {item.reviewedAt ? ` ${item.reviewedAt}` : ""}
        </span>
      </div>
      {item.specialReviewRequired && (
        <Alert
          type="warning"
          showIcon
          content={
            directSource
              ? "该语言被配置为专项审核；此处可直接查看提交原文，修改与审核必须前往多语言审核。"
              : "该语言被配置为小语种专项审核；此处仅供查看，修改与审核必须前往多语言审核。"
          }
        />
      )}
      <div
        className={`multilingual-result-compare${directSource ? " direct-source" : ""}`}
      >
        <section>
          <h4>{directSource ? "提交原文" : "源文案"}</h4>
          <ReadonlyContent content={sourceContent} />
        </section>
        {!directSource && (
          <section>
            <h4>机器翻译</h4>
            <ReadonlyContent content={machineContent} />
          </section>
        )}
        <section>
          <h4>{directSource ? "当前审核稿" : canEdit ? "人工校对" : "当前结果"}</h4>
          {canEdit ? (
            <Form layout="vertical">
              <Form.Item label="标题"><Input value={title} onChange={setTitle} /></Form.Item>
              <Form.Item label="摘要"><Input.TextArea value={summary} onChange={setSummary} rows={3} /></Form.Item>
              <Form.Item label="正文"><Input.TextArea value={body} onChange={setBody} rows={7} /></Form.Item>
            </Form>
          ) : (
            <ReadonlyContent content={currentContent} />
          )}
        </section>
      </div>
      <div className="multilingual-result-actions">
        {canEdit && (
          <Space>
            <Button onClick={save}>保存修订</Button>
            <Button type="primary" disabled={!item.variablesValid} onClick={approve}>
              修订并通过
            </Button>
          </Space>
        )}
        {canEnterSpecialReview && (
          <Button
            type="primary"
            onClick={() => navigate(`/multilingual-review?item=${item.id}`)}
          >
            {directSource ? "前往语言审核" : "前往多语言审核"}
          </Button>
        )}
      </div>
    </div>
  );
}
