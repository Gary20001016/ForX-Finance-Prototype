import { Alert } from "@arco-design/web-react";
import MessagePreview from "../../components/MessagePreview";
import type { TranslationBatch, TranslationItem } from "../../domain/types";
import { usePrototypeStore } from "../../store/prototypeStore";
import { resolveMultilingualPreview } from "./resolveMultilingualPreview";

export default function MultilingualMessagePreview({
  batch,
  item,
}: {
  batch: TranslationBatch;
  item: TranslationItem;
}) {
  const store = usePrototypeStore();
  const ruleVersion =
    batch.subjectType === "rule_content_version"
      ? store.ruleVersions.find(
          (candidate) => candidate.id === (batch.subjectId || item.templateId),
        )
      : undefined;
  const template = store.templates.find(
    (candidate) =>
      candidate.id === item.templateId ||
      candidate.id === ruleVersion?.templateId,
  );
  const resolved = resolveMultilingualPreview(
    batch,
    item,
    template?.content,
    template?.channels,
  );

  if (!resolved.content) {
    return (
      <div className="multilingual-message-preview empty">
        <Alert
          type={item.errorMessage ? "error" : "info"}
          showIcon
          title="暂无可预览内容"
          content={
            item.errorMessage
              ? `${item.errorCode || "TRANSLATION_FAILED"} · ${item.errorMessage}`
              : "该语言尚未返回可用的翻译结果"
          }
        />
      </div>
    );
  }

  return (
    <div className="multilingual-message-preview">
      <MessagePreview
        compact
        content={resolved.content}
        channels={resolved.channels}
        showPushPriority={batch.subjectType === "rule_content_version"}
      />
    </div>
  );
}
