import { Button, Drawer, Progress, Space, Steps, Tag } from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";
import type { TranslationBatch, TranslationItemStatus } from "../../domain/types";
import { deriveMultilingualProgress } from "./multilingualProgress";
import { localeName } from "./MultilingualProgressCell";

const statusColor: Partial<Record<TranslationItemStatus, string>> = {
  已通过: "green",
  审核通过: "green",
  翻译失败: "red",
  审核驳回: "orangered",
  待小语种专审: "purple",
  专审中: "purple",
  待普通确认: "orange",
  待人工审核: "orange",
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
  const progress = batch ? deriveMultilingualProgress(batch) : undefined;
  const current = !progress
    ? 0
    : progress.stage === "全部语言通过"
      ? 4
      : progress.stage === "小语种专审"
        ? 3
        : progress.stage === "普通语言确认"
          ? 2
          : 1;

  return (
    <Drawer
      width={900}
      visible={visible}
      title={batch ? `${batch.subjectName || batch.templateId} · 多语言流程` : "多语言流程"}
      onCancel={onClose}
      footer={null}
    >
      {batch && progress && (
        <div className="multilingual-progress-drawer">
          <div className="multilingual-drawer-summary">
            <div>
              <strong>{progress.approved}/{progress.total} 个目标语言已通过</strong>
              <span>当前阶段：{progress.stage}</span>
            </div>
            <Progress percent={progress.percent} size="small" />
          </div>
          <Steps current={current} size="small">
            <Steps.Step title="源文案完成" />
            <Steps.Step title="生成机器翻译" />
            <Steps.Step title="普通语言确认" />
            <Steps.Step title="小语种专项审核" />
            <Steps.Step title="全部语言通过" />
          </Steps>
          <div className="multilingual-drawer-list">
            {batch.items.map((item) => (
              <div className="multilingual-drawer-row" key={item.id}>
                <div>
                  <strong>{localeName[item.targetLocale] || item.targetLocale}</strong>
                  <span>{item.targetLocale}</span>
                </div>
                <Tag color={statusColor[item.status] || "gray"}>{item.status}</Tag>
                <span>{item.specialReviewRequired ? item.reviewGroup || "专项审核组" : "源页面确认"}</span>
                <span>{item.reviewSlaHours ? `SLA ${item.reviewSlaHours} 小时` : "—"}</span>
                <Space>
                  {item.status === "待小语种专审" && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => navigate(`/multilingual-review?item=${item.id}`)}
                    >
                      前往专审
                    </Button>
                  )}
                  {item.status === "专审中" && (
                    <Button
                      size="small"
                      onClick={() => navigate(`/multilingual-review?item=${item.id}`)}
                    >
                      查看专审
                    </Button>
                  )}
                </Space>
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
