import type {
  Channel,
  ContentApprovalStatus,
  ContentWorkflowStage,
  LocalizedMessageContent,
  ManualTemplateStatus,
  MessageCategoryCode,
  MessageTopicCode,
  RiskLevel,
  VariableReviewStatus,
} from "./types";

export interface ContentApprovalSnapshot {
  sourceLocale: string;
  locales: readonly string[];
  channels: readonly Channel[];
  category: MessageCategoryCode;
  topic: MessageTopicCode;
  risk: RiskLevel;
  content: LocalizedMessageContent;
  variables?: readonly string[];
}

export const templateMainStatusForStage = (
  stage: ContentWorkflowStage,
): ManualTemplateStatus =>
  stage === "published"
    ? "已发布"
    : stage === "rejected"
      ? "驳回"
      : stage === "draft"
        ? "草稿"
        : "审核中";

export const shouldStartLocalization = (
  contentStatus: ContentApprovalStatus,
  variableStatus: VariableReviewStatus = "不适用",
) => contentStatus === "已通过" && ["不适用", "已通过"].includes(variableStatus);

const stageLabels: Record<ContentWorkflowStage, string> = {
  draft: "编辑内容",
  content_review: "内容审核中",
  variable_review: "变量审核中",
  rejected: "内容已驳回",
  translation_creating: "多语言任务创建中",
  localization_review: "多语言审核中",
  ready: "发布就绪",
  published: "已发布",
  sending_ready: "发送就绪",
};

export const contentWorkflowStageLabel = (stage?: ContentWorkflowStage) =>
  stageLabels[stage || "draft"];

const fnv1a = (value: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const contentApprovalHash = (snapshot: ContentApprovalSnapshot) => {
  const serialized = JSON.stringify({
    sourceLocale: snapshot.sourceLocale,
    locales: [...snapshot.locales].sort(),
    channels: [...snapshot.channels].sort(),
    category: snapshot.category,
    topic: snapshot.topic,
    risk: snapshot.risk,
    content: snapshot.content,
    variables: [...(snapshot.variables || [])].sort(),
  });
  return `content-${fnv1a(serialized)}`;
};
