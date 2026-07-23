import { useEffect, useState } from "react";
import { Button, Drawer, Progress, Space, Tag } from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";
import type { TranslationBatch, TranslationItemStatus } from "../../domain/types";
import { usePrototypeStore } from "../../store/prototypeStore";
import { deriveMultilingualProgress } from "./multilingualProgress";
import { localeName } from "./MultilingualProgressCell";
import MultilingualMessagePreview from "./MultilingualMessagePreview";
import MultilingualResultPanel from "./MultilingualResultPanel";

const statusColor: Partial<Record<TranslationItemStatus, string>> = {
  已通过: "green",
  无结果: "red",
  翻译返回待审核: "orange",
};

export default function MultilingualProgressDrawer({
  batch,
  visible,
  onClose,
  readOnly = false,
}: {
  batch?: TranslationBatch;
  visible: boolean;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const navigate = useNavigate();
  const store = usePrototypeStore();
  const liveBatch = batch
    ? store.translationBatches.find((candidate) => candidate.id === batch.id) || batch
    : undefined;
  const [expandedView, setExpandedView] = useState<{
    itemId: string;
    mode: "content" | "preview";
  }>();
  useEffect(() => setExpandedView(undefined), [batch?.id]);
  const progress = liveBatch ? deriveMultilingualProgress(liveBatch) : undefined;
  const directSource = liveBatch?.productionMode === "direct_source_review";

  return (
    <Drawer
      width={1180}
      visible={visible}
      title={liveBatch ? `${liveBatch.subjectName || liveBatch.templateId} · 多语言流程` : "多语言流程"}
      onCancel={onClose}
      footer={null}
    >
      {liveBatch && progress && (
        <div className="multilingual-progress-drawer">
          <div className="multilingual-drawer-summary">
            <div>
              <strong>
                {progress.approved}/{progress.total} 个
                {directSource ? "语言" : "目标语言"}已通过
              </strong>
              <span>
                当前状态：
                {directSource && progress.status === "翻译返回待审核"
                  ? "原文待审核"
                  : progress.status}
              </span>
            </div>
            <Progress percent={progress.percent} size="small" />
          </div>
          <div className="multilingual-drawer-list">
            {liveBatch.items.map((item) => (
              <div className="multilingual-drawer-item" key={item.id}>
                <div className="multilingual-drawer-row">
                  <div>
                    <strong>{localeName[item.targetLocale] || item.targetLocale}</strong>
                    <span>{item.targetLocale}</span>
                  </div>
                  <Tag color={statusColor[item.status] || "gray"}>
                    {directSource && item.status === "翻译返回待审核"
                      ? "原文待审核"
                      : item.status}
                  </Tag>
                  <span>
                    {item.specialReviewRequired ? (
                      <Tag color="purple">需专项审核</Tag>
                    ) : (
                      "进度内校对"
                    )}
                  </span>
                  <span>{item.reviewSlaHours ? `SLA ${item.reviewSlaHours} 小时` : "—"}</span>
                  <Space>
                    <Button
                      size="small"
                      onClick={() =>
                        setExpandedView((current) =>
                          current?.itemId === item.id &&
                          current.mode === "content"
                            ? undefined
                            : { itemId: item.id, mode: "content" },
                        )
                      }
                    >
                      {expandedView?.itemId === item.id &&
                      expandedView.mode === "content"
                        ? directSource
                          ? "收起原文"
                          : "收起译文"
                        : directSource
                          ? "查看原文"
                          : "查看译文"}
                    </Button>
                    <Button
                      size="small"
                      onClick={() =>
                        setExpandedView((current) =>
                          current?.itemId === item.id &&
                          current.mode === "preview"
                            ? undefined
                            : { itemId: item.id, mode: "preview" },
                        )
                      }
                    >
                      {expandedView?.itemId === item.id &&
                      expandedView.mode === "preview"
                        ? "收起预览"
                        : "预览"}
                    </Button>
                    {item.status === "翻译返回待审核" && item.specialReviewRequired && (
                      <Button
                        size="small"
                        type="primary"
                        disabled={readOnly}
                        onClick={() => navigate(`/multilingual-review?item=${item.id}`)}
                      >
                        {directSource ? "前往语言审核" : "前往专审"}
                      </Button>
                    )}
                  </Space>
                </div>
                {expandedView?.itemId === item.id &&
                  (expandedView.mode === "content" ? (
                    <MultilingualResultPanel batch={liveBatch} item={item} readOnly={readOnly} />
                  ) : (
                    <MultilingualMessagePreview batch={liveBatch} item={item} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
