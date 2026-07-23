import type {
  ManualTemplateStatus,
  MessageTemplate,
} from "./types";

export const MANUAL_TEMPLATE_STATUSES = [
  "草稿",
  "审核中",
  "驳回",
  "已发布",
] as const satisfies readonly ManualTemplateStatus[];

const reviewingStatuses = new Set(["审核中", "待业务审核", "待审核"]);
const rejectedStatuses = new Set(["驳回", "已驳回"]);

export const normalizeManualTemplateStatus = (
  status: string,
): ManualTemplateStatus => {
  if (status === "已发布") return "已发布";
  if (reviewingStatuses.has(status)) return "审核中";
  if (rejectedStatuses.has(status)) return "驳回";
  return "草稿";
};

export const normalizeManualTemplateStatuses = (
  templates: MessageTemplate[],
): MessageTemplate[] =>
  templates.map((template) =>
    template.usageScope === "event"
      ? template
      : {
          ...template,
          status: normalizeManualTemplateStatus(template.status),
        },
  );
