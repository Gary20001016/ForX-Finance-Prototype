export type OperatorPermission =
  | "content.create"
  | "content.submit"
  | "variable.manage"
  | "business.review"
  | "risk.review";

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
  permissions: OperatorPermission[];
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
  },
  {
    id: "reviewer-en-01",
    name: "Emily Chen",
    team: "消息运营",
    enabled: true,
    isSuperAdmin: false,
    permissions: ["content.create", "content.submit"],
  },
  {
    id: "reviewer-zh-01",
    name: "王璐",
    team: "消息运营",
    enabled: true,
    isSuperAdmin: false,
    permissions: ["content.create", "content.submit", "business.review"],
  },
  {
    id: "reviewer-fr-01",
    name: "Camille Martin",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
  },
  {
    id: "reviewer-es-01",
    name: "Lucía García",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
  },
  {
    id: "reviewer-ja-01",
    name: "松本遥",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
  },
  {
    id: "reviewer-ko-01",
    name: "김민준",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
  },
  {
    id: "reviewer-tr-01",
    name: "Deniz Kaya",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
  },
  {
    id: "reviewer-ru-01",
    name: "Анна Волкова",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    permissions: [],
  },
];

export const reviewOperatorName = (operatorId?: string) =>
  reviewOperators.find((operator) => operator.id === operatorId)?.name ||
  operatorId ||
  "—";
