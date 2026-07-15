import { Button, Progress, Tag } from "@arco-design/web-react";
import type { TranslationBatch, TranslationItemStatus } from "../../domain/types";
import {
  deriveMultilingualProgress,
  unfinishedLocales,
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

const compactStatus: Partial<Record<TranslationItemStatus, string>> = {
  待小语种专审: "待专审",
  待普通确认: "待确认",
  待人工审核: "待确认",
};

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
  const unfinished = unfinishedLocales(batch);
  return (
    <div className="multilingual-progress-cell">
      <div className="multilingual-progress-heading">
        <strong>{progress.approved}/{progress.total} 已通过</strong>
        <Tag color={progress.stage === "全部语言通过" ? "green" : "arcoblue"}>
          {progress.stage}
        </Tag>
      </div>
      <Progress percent={progress.percent} size="small" showText={false} />
      <div className="multilingual-unfinished">
        {unfinished.slice(0, 3).map((item) => (
          <span key={item.locale}>
            {localeName[item.locale] || item.locale} · {compactStatus[item.status] || item.status}
          </span>
        ))}
        {unfinished.length > 3 && <span>其余 {unfinished.length - 3} 种</span>}
      </div>
      <Button type="text" size="mini" onClick={onOpen}>
        查看多语言进度
      </Button>
    </div>
  );
}
