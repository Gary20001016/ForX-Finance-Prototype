import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Message,
  Tag,
  Timeline,
} from "@arco-design/web-react";
import MarkdownContent, {
  hasUnsafeMarkdownLinks,
} from "../../components/MarkdownContent";
import MarkdownEditor from "../../components/MarkdownEditor";
import { haveSameVariableOccurrences } from "../../domain/manualMessageVariables";
import { CURRENT_REVIEW_OPERATOR_ID } from "../../domain/reviewOperators";
import type { TranslationItem } from "../../domain/types";
import {
  approveOrdinaryTranslation,
  approveSpecialReview,
  approveTranslation,
  canReviewTranslation,
  rejectTranslation,
  saveTranslationDraft,
  usePrototypeStore,
} from "../../store/prototypeStore";

export default function TranslationReviewDrawer({
  item,
  visible,
  onClose,
  currentAdmin = CURRENT_REVIEW_OPERATOR_ID,
  reviewMode = "legacy",
}: {
  item?: TranslationItem;
  visible: boolean;
  onClose: () => void;
  currentAdmin?: string;
  reviewMode?: "ordinary" | "special" | "legacy";
}) {
  const store = usePrototypeStore();
  const liveItem = item
    ? store.translationBatches
        .flatMap((batch) => batch.items)
        .find((candidate) => candidate.id === item.id)
    : undefined;
  const current = liveItem || item;
  const template = store.templates.find(
    (candidate) => candidate.id === current?.templateId,
  );
  const batch = current
    ? store.translationBatches.find(
        (candidate) => candidate.id === current.batchId,
      )
    : undefined;
  const directSource =
    current?.productionMode === "direct_source_review" ||
    batch?.productionMode === "direct_source_review";
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setTitle(current?.humanDraft?.title || current?.machineTitle || "");
    setSummary(current?.humanDraft?.summary || current?.machineSummary || "");
    setBody(current?.humanDraft?.body || current?.machineBody || "");
    setReason("");
  }, [current?.id]);

  const isAuthorized = Boolean(
    current && canReviewTranslation(current, currentAdmin),
  );
  const sourceBody =
    batch?.sourceContent?.body || template?.content?.web.body || "";
  const sourceVariableText = [
    batch?.sourceContent?.title,
    batch?.sourceContent?.summary,
    sourceBody,
  ]
    .filter(Boolean)
    .join("\n");

  const reject = () => {
    if (!current) return;
    if (!isAuthorized) {
      Message.warning("无该语言审核权限");
      return;
    }
    if (!reason.trim()) {
      Message.warning(directSource ? "请先填写退回修改原因" : "请先填写驳回重翻原因");
      return;
    }
    rejectTranslation(current.id, reason, currentAdmin);
    Message.success(`${current.targetLocale} 已驳回，保留在待审核状态`);
    onClose();
  };

  const approve = () => {
    if (!current) return;
    if (!isAuthorized) {
      Message.warning("无该语言审核权限");
      return;
    }
    if (!current.variablesValid) {
      Message.error("模板变量校验失败，禁止通过");
      return;
    }
    if (
      !haveSameVariableOccurrences(
        sourceVariableText,
        [title, summary, body].filter(Boolean).join("\n"),
      )
    ) {
      Message.error("人工修订不能修改或遗漏模板变量");
      return;
    }
    if (hasUnsafeMarkdownLinks(body)) {
      Message.error(
        "Markdown 包含不允许的链接，仅支持 http、https 和 forxfinance 协议",
      );
      return;
    }
    const values = { title, summary, body, reviewer: currentAdmin };
    if (reviewMode === "ordinary") {
      approveOrdinaryTranslation(current.id, values);
    } else if (reviewMode === "special") {
      approveSpecialReview(current.id, values);
    } else {
      approveTranslation(current.id, values);
    }
    Message.success(`${current.targetLocale} 修订结果已通过`);
    onClose();
  };

  const saveDraft = () => {
    if (!current) return;
    if (!isAuthorized) {
      Message.warning("无该语言审核权限");
      return;
    }
    saveTranslationDraft(
      current.id,
      { title, summary, body },
      currentAdmin,
    );
    Message.success("人工修订草稿已保存");
  };

  return (
    <Drawer
      width={920}
      visible={visible}
      title={
        current
          ? `${current.subjectName || current.templateName} · ${current.targetLocale} ${directSource ? "原文校对" : reviewMode === "special" ? "专项审核" : "翻译校对"}`
          : "翻译审核"
      }
      onCancel={onClose}
      footer={
        current && (
          <div className="drawer-footer">
            <Button onClick={onClose}>取消</Button>
            {isAuthorized && (
              <>
                <Button onClick={saveDraft}>{directSource ? "保存审核稿" : "保存修订"}</Button>
                <Button status="danger" onClick={reject}>
                  {directSource ? "退回修改" : "驳回"}
                </Button>
                <Button
                  type="primary"
                  disabled={!current.variablesValid}
                  onClick={approve}
                >
                  {directSource
                    ? "原文审核通过"
                    : reviewMode === "special"
                      ? "专项审核通过"
                      : "修订并通过"}
                </Button>
              </>
            )}
          </div>
        )
      }
    >
      {current && (
        <div className="translation-review">
          {!isAuthorized && (
            <Alert
              type="warning"
              showIcon
              title="无该语言审核权限"
              content="你可以查看内容，但不能修改、驳回或通过该语言的审核。请由系统配置中已授权的审核人处理。"
            />
          )}
          <Descriptions
            column={3}
            border
            data={
              directSource
                ? [
                    {
                      label: "原文语言",
                      value: <Tag color="arcoblue">{current.sourceLocale}</Tag>,
                    },
                    { label: "内容来源", value: "操作者直接编写" },
                    { label: "提交人", value: current.submitter },
                    {
                      label: "源内容哈希",
                      value: <span className="mono">{current.sourceContentHash}</span>,
                    },
                    {
                      label: "变量完整性",
                      value: (
                        <Tag color={current.variablesValid ? "green" : "red"}>
                          {current.variablesValid ? "检查通过" : "检查失败"}
                        </Tag>
                      ),
                    },
                    { label: "提交时间", value: current.submittedAt || "—" },
                  ]
                : [
                    {
                      label: "目标语言",
                      value: <Tag color="arcoblue">{current.targetLocale}</Tag>,
                    },
                    {
                      label: "外部任务 ID",
                      value: <span className="mono">{current.externalTaskId}</span>,
                    },
                    { label: "翻译尝试", value: `第 ${current.attemptNo} 次` },
                    {
                      label: "源内容哈希",
                      value: <span className="mono">{current.sourceContentHash}</span>,
                    },
                    {
                      label: "变量完整性",
                      value: (
                        <Tag color={current.variablesValid ? "green" : "red"}>
                          {current.variablesValid ? "检查通过" : "检查失败"}
                        </Tag>
                      ),
                    },
                    { label: "完成时间", value: current.translatedAt || "—" },
                  ]
            }
          />
          <div className="translation-compare">
            <section>
              <div className="compare-heading">
                <span>{current.sourceLocale} · 源文案</span>
                <h3>{directSource ? "提交原文" : "默认语言源文案"}</h3>
              </div>
              <label>
                标题
                <div className="source-copy">
                  {batch?.sourceContent?.title ||
                    template?.content?.web.title ||
                    current.templateName}
                </div>
              </label>
              <label>
                摘要
                <div className="source-copy">
                  {batch?.sourceContent?.summary ||
                    template?.content?.web.summary}
                </div>
              </label>
              <label>
                正文 Markdown 源码
                <pre className="markdown-source">{sourceBody}</pre>
              </label>
              <label>
                正文渲染效果
                <div className="source-copy body">
                  <MarkdownContent value={sourceBody} />
                </div>
              </label>
            </section>
            <section>
              <div className="compare-heading">
                <span>
                  {current.targetLocale} · {directSource ? "人工审核" : "机翻与人工修订"}
                </span>
                <h3>{directSource ? "人工审核稿" : "机器翻译与人工修订"}</h3>
              </div>
              <Form layout="vertical">
                <Form.Item label="标题">
                  <Input disabled={!isAuthorized} value={title} onChange={setTitle} />
                </Form.Item>
                <Form.Item label="摘要">
                  <Input.TextArea disabled={!isAuthorized} value={summary} onChange={setSummary} />
                </Form.Item>
                <Form.Item label="正文 Markdown">
                  <MarkdownEditor
                    value={body}
                    onChange={setBody}
                    minRows={6}
                    readOnly={!isAuthorized}
                  />
                </Form.Item>
              </Form>
            </section>
          </div>
          <div className="translation-checks">
            <Tag color={current.variablesValid ? "green" : "red"}>
              变量检查 · {current.variablesValid ? "通过" : "失败"}
            </Tag>
            <Tag color="green">金额与币种一致</Tag>
            <Tag color="green">交易对未翻译</Tag>
            <Tag color="orange">Markdown 结构需人工确认</Tag>
            <Tag color="orange">风险用语需人工确认</Tag>
          </div>
          <Form layout="vertical">
            <Form.Item
              label={directSource ? "退回修改原因" : "驳回原因"}
              extra={
                directSource
                  ? "退回时必填；状态仍为“原文待审核”，修改后可重新提交审核"
                  : "驳回时必填；状态仍为“翻译返回待审核”，可继续修改后复审"
              }
            >
              <Input.TextArea
                disabled={!isAuthorized}
                value={reason}
                onChange={setReason}
              />
            </Form.Item>
          </Form>
          <div className="review-history">
            <strong>审核与任务轨迹</strong>
            <Timeline>
              {directSource ? (
                <>
                  <Timeline.Item>
                    {current.submittedAt} {current.submitter} 提交单语言原文
                  </Timeline.Item>
                  <Timeline.Item>当前 · 原文待审核</Timeline.Item>
                </>
              ) : (
                <>
                  <Timeline.Item>
                    {current.submittedAt} {current.submitter} 提交外部机翻
                  </Timeline.Item>
                  <Timeline.Item>
                    {current.translatedAt} 外部服务回调成功
                  </Timeline.Item>
                  <Timeline.Item>当前 · 翻译返回待审核</Timeline.Item>
                </>
              )}
            </Timeline>
          </div>
        </div>
      )}
    </Drawer>
  );
}
