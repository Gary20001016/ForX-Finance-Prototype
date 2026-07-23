import type { MessageTemplate } from "./types";

export const APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE =
  "业务审核已通过，已发布的人工消息模板不可修改";

export const isApprovedManualTemplateLocked = (
  template: Pick<MessageTemplate, "status" | "usageScope">,
) => template.status === "已发布" && template.usageScope !== "event";
