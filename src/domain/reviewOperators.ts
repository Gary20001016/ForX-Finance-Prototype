import {
  createPagePermissions,
  fullPagePermissions,
  type PagePermissionMap,
} from "./pagePermissions";

/** @deprecated Transitional field for legacy persisted capability data. */
export type OperatorPermission =
  | "content.create"
  | "content.submit"
  | "variable.manage"
  | "business.review"
  | "risk.review";

/** @deprecated Page permissions replace these labels in the personnel UI. */
export const operatorPermissionLabels: Record<OperatorPermission, string> = {
  "content.create": "创建内容",
  "content.submit": "提交审核",
  "variable.manage": "模板变量维护",
  "business.review": "一级业务审核",
  "risk.review": "风控审核",
};

export interface ReviewOperator {
  id: string;
  name: string;
  team: string;
  enabled: boolean;
  isSuperAdmin: boolean;
  /** @deprecated Kept until the personnel permission panel migration is complete. */
  permissions: OperatorPermission[];
  pagePermissions: PagePermissionMap;
}

export const CURRENT_REVIEW_OPERATOR_ID = "admin-01";

export const reviewOperators: ReviewOperator[] = [
  {
    id: "admin-01",
    name: "Gary Ma",
    team: "系统管理",
    enabled: true,
    isSuperAdmin: true,
    permissions: Object.keys(operatorPermissionLabels) as OperatorPermission[],
    pagePermissions: fullPagePermissions(),
  },
  {
    id: "reviewer-en-01",
    name: "Emily Chen",
    team: "消息运营",
    enabled: true,
    isSuperAdmin: false,
    permissions: ["content.create", "content.submit"],
    pagePermissions: createPagePermissions(undefined, [
      "manual.tasks",
      "manual.templates",
    ]),
  },
  {
    id: "reviewer-zh-01",
    name: "王璐",
    team: "消息运营",
    enabled: true,
    isSuperAdmin: false,
    permissions: ["content.create", "content.submit", "business.review"],
    pagePermissions: createPagePermissions(undefined, [
      "manual.tasks",
      "manual.templates",
      "operations.approvals",
    ]),
  },
  {
    id: "reviewer-fr-01",
    name: "Camille Martin",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-es-01",
    name: "Lucía García",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-ja-01",
    name: "松本遥",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-ko-01",
    name: "김민준",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-tr-01",
    name: "Deniz Kaya",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-ru-01",
    name: "Анна Волкова",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
    pagePermissions: createPagePermissions(),
  },
];

export const reviewOperatorName = (operatorId?: string) =>
  reviewOperators.find((operator) => operator.id === operatorId)?.name ||
  operatorId ||
  "—";
