import { useEffect, useState } from "react";
import { Button, Drawer, Progress, Space, Tag } from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";
import type { TranslationBatch, TranslationItemStatus } from "../../domain/types";
import { usePrototypeStore } from "../../store/prototypeStore";
import { deriveMultilingualProgress } from "./multilingualProgress";
import { localeName } from "./MultilingualProgressCell";
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
}: {
  batch?: TranslationBatch;
  visible: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const store = usePrototypeStore();
  const liveBatch = batch
    ? store.translationBatches.find((candidate) => candidate.id === batch.id) || batch
    : undefined;
  const [expandedItemId, setExpandedItemId] = useState<string>();
  useEffect(() => setExpandedItemId(undefined), [batch?.id]);
  const progress = liveBatch ? deriveMultilingualProgress(liveBatch) : undefined;

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
              <strong>{progress.approved}/{progress.total} 个目标语言已通过</strong>
              <span>当前状态：{progress.status}</span>
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
                  <Tag color={statusColor[item.status] || "gray"}>{item.status}</Tag>
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
                      onClick={() => setExpandedItemId((current) => current === item.id ? undefined : item.id)}
                    >
                      {expandedItemId === item.id ? "收起译文" : "查看译文"}
                    </Button>
                    {item.status === "翻译返回待审核" && item.specialReviewRequired && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => navigate(`/multilingual-review?item=${item.id}`)}
                      >
                        前往专审
                      </Button>
                    )}
                  </Space>
                </div>
                {expandedItemId === item.id && (
                  <MultilingualResultPanel batch={liveBatch} item={item} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
