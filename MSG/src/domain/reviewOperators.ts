import {
  createPagePermissions,
  fullPagePermissions,
  type PagePermissionMap,
} from "./pagePermissions";

export interface ReviewOperator {
  id: string;
  name: string;
  team: string;
  enabled: boolean;
  isSuperAdmin: boolean;
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
    pagePermissions: fullPagePermissions(),
  },
  {
    id: "reviewer-en-01",
    name: "Emily Chen",
    team: "消息运营",
    enabled: true,
    isSuperAdmin: false,
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
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-es-01",
    name: "Lucía García",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-ja-01",
    name: "松本遥",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-ko-01",
    name: "김민준",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-tr-01",
    name: "Deniz Kaya",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    pagePermissions: createPagePermissions(),
  },
  {
    id: "reviewer-ru-01",
    name: "Анна Волкова",
    team: "内容审核",
    enabled: true,
    isSuperAdmin: false,
    pagePermissions: createPagePermissions(),
  },
];

export const reviewOperatorName = (operatorId?: string) =>
  reviewOperators.find((operator) => operator.id === operatorId)?.name ||
  operatorId ||
  "—";
