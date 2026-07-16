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
import type { TranslationItem } from "../../domain/types";
import {
  approveOrdinaryTranslation,
  approveSpecialReview,
  approveTranslation,
  rejectTranslation,
  saveTranslationDraft,
  usePrototypeStore,
} from "../../store/prototypeStore";

export default function TranslationReviewDrawer({
  item,
  visible,
  onClose,
  currentAdmin = "Gary Ma",
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
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setTitle(current?.machineTitle || "");
    setSummary(current?.machineSummary || "");
    setBody(current?.machineBody || "");
    setReason("");
  }, [current?.id]);

  const isSelf = current?.submitter === currentAdmin;
  const sourceBody =
    batch?.sourceContent?.body || template?.content?.web.body || "";

  const reject = () => {
    if (!current) return;
    if (isSelf) {
      Message.warning("机翻提交人与人工审核人必须不同");
      return;
    }
    if (!reason.trim()) {
      Message.warning("请先填写驳回重翻原因");
      return;
    }
    rejectTranslation(current.id, reason);
    Message.success(`${current.targetLocale} 已驳回，可从多语言流程单独重翻`);
    onClose();
  };

  const approve = () => {
    if (!current) return;
    if (reviewMode !== "ordinary" && isSelf) {
      Message.warning("机翻提交人与人工审核人必须不同");
      return;
    }
    if (!current.variablesValid) {
      Message.error("模板变量校验失败，禁止通过");
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
    saveTranslationDraft(current.id, { title, summary, body });
    Message.success("人工修订草稿已保存");
  };

  return (
    <Drawer
      width={920}
      visible={visible}
      title={
        current
          ? `${current.subjectName || current.templateName} · ${current.targetLocale} ${reviewMode === "special" ? "专项审核" : "翻译校对"}`
          : "翻译审核"
      }
      onCancel={onClose}
      footer={
        current && (
          <div className="drawer-footer">
            <Button onClick={onClose}>取消</Button>
            <Button onClick={saveDraft}>保存修订</Button>
            <Button
              status="danger"
              disabled={reviewMode !== "ordinary" && isSelf}
              onClick={reject}
            >
              驳回重翻
            </Button>
            <Button
              type="primary"
              disabled={
                (reviewMode !== "ordinary" && isSelf) ||
                !current.variablesValid
              }
              onClick={approve}
            >
              {reviewMode === "special" ? "专项审核通过" : "修订并通过"}
            </Button>
          </div>
        )
      }
    >
      {current && (
        <div className="translation-review">
          {isSelf && (
            <Alert
              type="warning"
              title="职责分离限制"
              content="机翻任务提交人与人工审核人必须不同，请转交其他语言审核人。"
            />
          )}
          <Alert
            type="info"
            showIcon
            title="翻译成功后必须人工审核"
            content="核对数字、币种、交易对、风险措辞、Markdown 结构和模板变量；修订内容与机翻原文分别留档。"
          />
          <Descriptions
            column={3}
            border
            data={[
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
            ]}
          />
          <div className="translation-compare">
            <section>
              <div className="compare-heading">
                <span>{current.sourceLocale} · 源文案</span>
                <h3>默认语言源文案</h3>
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
                <span>{current.targetLocale} · 机翻与人工修订</span>
                <h3>机器翻译与人工修订</h3>
              </div>
              <Form layout="vertical">
                <Form.Item label="标题">
                  <Input value={title} onChange={setTitle} />
                </Form.Item>
                <Form.Item label="摘要">
                  <Input.TextArea value={summary} onChange={setSummary} />
                </Form.Item>
                <Form.Item label="正文 Markdown">
                  <MarkdownEditor
                    value={body}
                    onChange={setBody}
                    minRows={6}
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
              label="驳回重翻原因"
              extra="驳回时必填，原因将传入新的单语言外部任务"
            >
              <Input.TextArea value={reason} onChange={setReason} />
            </Form.Item>
          </Form>
          <div className="review-history">
            <strong>审核与任务轨迹</strong>
            <Timeline>
              <Timeline.Item>
                {current.submittedAt} {current.submitter} 提交外部机翻
              </Timeline.Item>
              <Timeline.Item>
                {current.translatedAt} 外部服务回调成功
              </Timeline.Item>
              <Timeline.Item>当前 · 等待人工审核</Timeline.Item>
            </Timeline>
          </div>
        </div>
      )}
    </Drawer>
  );
}
