import { Button, Progress, Tag } from "@arco-design/web-react";
import type { TranslationBatch } from "../../domain/types";
import {
  deriveMultilingualProgress,
} from "./multilingualProgress";

export const localeName: Record<string, string> = {
  "en-US": "英语",
  "zh-TW": "繁体中文",
  "fr-FR": "法语",
  "es-ES": "西班牙语",
  "ja-JP": "日语",
  "ko-KR": "韩语",
  "tr-TR": "土耳其语",
  "ru-RU": "俄语",
};

const namesFor = (locales: string[]) =>
  locales.map((locale) => localeName[locale] || locale).join("、");

export default function MultilingualProgressCell({
  batch,
  onOpen,
}: {
  batch?: TranslationBatch;
  onOpen: () => void;
}) {
  if (!batch)
    return (
      <div className="multilingual-progress-cell empty">
        <Tag color="gray">未创建多语言任务</Tag>
      </div>
    );

  const progress = deriveMultilingualProgress(batch);
  return (
    <div className="multilingual-progress-cell">
      <div className="multilingual-progress-heading">
        <strong>{progress.approved}/{progress.total} 已通过</strong>
        <Tag
          color={
            progress.status === "已通过"
              ? "green"
              : progress.status === "无结果"
                ? "red"
                : "orange"
          }
        >
          {progress.status}
        </Tag>
      </div>
      <Progress percent={progress.percent} size="small" showText={false} />
      <div className="multilingual-unfinished">
        {progress.missingResultLocales.length > 0 && (
          <span>无结果：{namesFor(progress.missingResultLocales)}</span>
        )}
        {progress.pendingReviewLocales.length > 0 && (
          <span>待审核：{namesFor(progress.pendingReviewLocales)}</span>
        )}
        {progress.status === "已通过" && <span>全部目标语言均已通过</span>}
      </div>
      <Button type="text" size="mini" onClick={onOpen}>
        查看多语言进度
      </Button>
    </div>
  );
}
