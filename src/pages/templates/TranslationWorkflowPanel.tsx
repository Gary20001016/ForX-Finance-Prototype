import { useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Message,
  Progress,
  Select,
  Space,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";
import type {
  MessageTemplate,
  TranslationBatch,
  TranslationItem,
  TranslationItemStatus,
} from "../../domain/types";
import {
  CURRENT_REVIEW_OPERATOR_ID,
  reviewOperatorName,
} from "../../domain/reviewOperators";
import {
  createTranslationBatch,
  retryTranslation,
  submitTemplateForApproval,
} from "../../store/prototypeStore";
import TranslationReviewDrawer from "../approvals/TranslationReviewDrawer";
import { deriveMultilingualProgress } from "../multilingual/multilingualProgress";
import {
  APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE,
  isApprovedManualTemplateLocked,
} from "../../domain/templatePolicy";

const statusColor: Record<TranslationItemStatus, string> = {
  无结果: "red",
  翻译返回待审核: "orange",
  已通过: "green",
};

function LanguageAction({
  item,
  locked,
  directSource,
  onOrdinaryReview,
  readOnly,
}: {
  item: TranslationItem;
  locked: boolean;
  directSource?: boolean;
  onOrdinaryReview: () => void;
  readOnly: boolean;
}) {
  const navigate = useNavigate();
  if (readOnly) return <Button size="small" disabled>无写权限</Button>;
  if (locked) return <Button size="small" disabled>已锁定</Button>;
  if (item.status === "无结果") {
    return (
      <Button
        size="small"
        status="danger"
        onClick={() => {
          retryTranslation(item.id);
          Message.success(`${item.targetLocale} 已重新提交外部机翻任务`);
        }}
      >
        重试该语言
      </Button>
    );
  }
  if (item.status === "翻译返回待审核" && item.specialReviewRequired) {
    return (
      <Button
        size="small"
        type="primary"
        onClick={() => navigate(`/multilingual-review?item=${item.id}`)}
      >
        {directSource ? "前往语言审核" : "前往专项审核"}
      </Button>
    );
  }
  if (item.status === "翻译返回待审核") {
    return (
      <Button size="small" type="primary" onClick={onOrdinaryReview}>
        当场校对并确认
      </Button>
    );
  }
  return (
    <Button size="small" disabled>
      {item.reviewer ? `已由 ${reviewOperatorName(item.reviewer)} 审核` : "已通过"}
    </Button>
  );
}

export default function TranslationWorkflowPanel({
  template,
  batch,
  onEdit,
  context = "template",
  readOnly = false,
}: {
  template: MessageTemplate;
  batch?: TranslationBatch;
  onEdit?: () => void;
  context?: "template" | "temporary-task";
  readOnly?: boolean;
}) {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<string[]>(["en-US"]);
  const [ordinaryReviewId, setOrdinaryReviewId] = useState<string>();
  const sourceEditingLocked = isApprovedManualTemplateLocked(template);
  const singleLanguageReady =
    template.translationReadiness === "已通过" &&
    template.locales.length === 1 &&
    template.locales[0] === template.sourceLocale;

  if (!batch) {
    return (
      <div className="translation-flow">
        {singleLanguageReady ? (
          <>
            <Alert
              type="success"
              showIcon
              title="单语言内容已就绪"
              content={`${template.sourceLocale} 直接编写，无需机器翻译，可以进入业务审核。`}
            />
            {!sourceEditingLocked && (
              <div className="translation-gate ready">
                <div>
                  <strong>发布门禁 · 已通过</strong>
                  <p>单语言内容已完成语言准备，可以提交业务审核。</p>
                </div>
                <Space>
                  <Button disabled={readOnly} onClick={onEdit}>编辑源文案</Button>
                  <Button
                    type="primary"
                    disabled={readOnly || template.status === "已发布"}
                    onClick={() => {
                      const approval = submitTemplateForApproval(template.id);
                      Message.success(`已提交业务审核 ${approval.id}`);
                      navigate("/approvals");
                    }}
                  >
                    {template.status === "已发布" ? "已发布" : "提交业务审核"}
                  </Button>
                </Space>
              </div>
            )}
          </>
        ) : sourceEditingLocked ? (
          <Alert
            type="warning"
            showIcon
            title="模板已锁定"
            content={`${APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE}，当前模板没有可展示的翻译批次。`}
          />
        ) : (
          <>
            <Alert
              type="warning"
              showIcon
              content="该模板尚未创建翻译批次。请选择目标语言并提交外部异步机翻任务。"
            />
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                mode="multiple"
                value={targets}
                disabled={readOnly}
                onChange={setTargets}
                options={[
                  "en-US",
                  "zh-TW",
                  "ja-JP",
                  "ko-KR",
                  "es-ES",
                  "tr-TR",
                  "ru-RU",
                  "fr-FR",
                ].map((value) => ({ label: value, value }))}
              />
              <Button
                type="primary"
                disabled={readOnly || !targets.length}
                onClick={() => {
                  createTranslationBatch({
                    templateId: template.id,
                    targetLocales: targets,
                    createdBy: "Gary Ma",
                  });
                  Message.success("外部机翻批次已创建");
                }}
              >
                创建外部机翻任务
              </Button>
            </Space>
          </>
        )}
      </div>
    );
  }

  const summary = deriveMultilingualProgress(batch);
  const directSource = batch.productionMode === "direct_source_review";
  const ready = summary.status === "已通过";
  const temporaryTask = context === "temporary-task";
  const aggregateColor =
    summary.status === "已通过"
      ? "green"
      : summary.status === "无结果"
        ? "red"
        : "orange";

  return (
    <div className="translation-flow">
      <Alert
        type="info"
        showIcon
        title={directSource ? "单语言直接编写" : "外部异步机翻"}
        content={
          directSource
            ? "当前内容由操作者直接使用目标语言编写，不经过机器翻译；专项语言审核通过后即可继续。"
            : "平台后台提交外部任务；返回结果后进入人工审核。技术任务 ID、错误和时间仍保留用于排障。"
        }
      />
      <Descriptions
        column={2}
        border
        data={[
          { label: directSource ? "语言审核批次 ID" : "翻译批次 ID", value: <span className="mono">{batch.id}</span> },
          { label: "默认语言", value: `${batch.sourceLocale} · 操作者原文` },
          directSource
            ? { label: "生产方式", value: "单语言原文直接审核" }
            : { label: "目标语言", value: batch.targetLocales.join(" · ") },
          {
            label: "当前状态",
            value: (
              <Tag color={aggregateColor}>
                {directSource && summary.status === "翻译返回待审核"
                  ? "原文待审核"
                  : summary.status}
              </Tag>
            ),
          },
          { label: "创建人", value: batch.createdBy },
          { label: "最后更新", value: batch.updatedAt },
        ]}
      />
      <div className="translation-progress-head">
        <div>
          <strong>{directSource ? "原文审核进度" : "语言审核进度"}</strong>
          <span>{summary.approved}/{summary.total} 个{directSource ? "语言" : "目标语言"}已通过</span>
        </div>
        <Progress
          percent={summary.percent}
          size="small"
          status={summary.status === "无结果" ? "error" : undefined}
        />
      </div>
      <div className="translation-locale-list">
        <div className="translation-locale-header">
          <strong>{directSource ? "原文审核结果" : "逐语言结果"}</strong>
          <span>
            {directSource
              ? "直接查看操作者提交的原文，并前往多语言审核完成专项校对"
              : "无结果可重试；有结果后按语言配置进入当场校对或专项审核"}
          </span>
        </div>
        {batch.items.map((item) => (
          <div
            className={`translation-locale-row${directSource ? " direct-source" : ""}`}
            key={item.id}
          >
            <div className="locale-code">
              <strong>{item.targetLocale}</strong>
              <span>{item.id}</span>
            </div>
            {directSource ? (
              <div>
                <span className="muted">内容来源</span>
                <strong>操作者直接编写</strong>
              </div>
            ) : (
              <>
                <div>
                  <span className="muted">外部任务 ID</span>
                  <strong className="mono">{item.externalTaskId}</strong>
                </div>
                <div>
                  <span className="muted">尝试 / 结果时间</span>
                  <strong>第 {item.attemptNo} 次 · {item.translatedAt || "尚无结果"}</strong>
                </div>
              </>
            )}
            <Space>
              <Tag color={statusColor[item.status]}>
                {directSource && item.status === "翻译返回待审核"
                  ? "原文待审核"
                  : item.status}
              </Tag>
              {item.specialReviewRequired && <Tag color="purple">需专项审核</Tag>}
            </Space>
            <LanguageAction
              item={item}
              locked={sourceEditingLocked}
              directSource={directSource}
              readOnly={readOnly}
              onOrdinaryReview={() => setOrdinaryReviewId(item.id)}
            />
            {item.errorMessage && (
              <div className="translation-error">
                <span className="mono">{item.errorCode || "REVIEW_REJECTED"}</span>
                {" · "}{item.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={`translation-gate ${ready ? "ready" : "blocked"}`}>
        <div>
          <strong>
            {temporaryTask ? "任务提交门禁" : "发布门禁"} · {ready ? "已通过" : "未通过"}
          </strong>
          <p>
            {ready
              ? temporaryTask
                ? `${directSource ? "原文" : "全部目标语言"}已完成人工审核，可以继续提交消息任务业务审核。`
                : `${directSource ? "原文" : "全部目标语言"}已完成人工审核，可以提交业务审核。`
              : temporaryTask
                ? `${directSource ? "原文尚未" : "仍有目标语言未"}人工审核通过，临时消息任务不可提交业务审核。`
                : `${directSource ? "原文尚未" : "仍有目标语言未"}人工审核通过，模板不可发布，也不可用于消息任务。`}
          </p>
        </div>
        {!temporaryTask && (
          <Space>
            {sourceEditingLocked ? (
              <Tooltip content={APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE}>
                <span><Button disabled>编辑源文案</Button></span>
              </Tooltip>
            ) : (
              <Button disabled={readOnly} onClick={onEdit}>编辑源文案</Button>
            )}
            <Button
              type="primary"
              disabled={readOnly || !ready || template.status === "已发布"}
              onClick={() => {
                const approval = submitTemplateForApproval(template.id);
                Message.success(`已提交业务审核 ${approval.id}`);
                navigate("/approvals");
              }}
            >
              {template.status === "已发布" ? "已发布" : "提交业务审核"}
            </Button>
          </Space>
        )}
      </div>
      <TranslationReviewDrawer
        item={batch.items.find((item) => item.id === ordinaryReviewId)}
        visible={Boolean(ordinaryReviewId)}
        onClose={() => setOrdinaryReviewId(undefined)}
        currentAdmin={CURRENT_REVIEW_OPERATOR_ID}
        reviewMode="ordinary"
      />
    </div>
  );
}
