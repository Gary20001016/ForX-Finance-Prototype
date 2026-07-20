export interface ReviewOperator {
  id: string;
  name: string;
  team: string;
  enabled: boolean;
}

export const CURRENT_REVIEW_OPERATOR_ID = "admin-01";

export const reviewOperators: ReviewOperator[] = [
  { id: "admin-01", name: "Gary Ma", team: "超级管理员", enabled: true },
  { id: "reviewer-en-01", name: "Emily Chen", team: "英语审核", enabled: true },
  { id: "reviewer-zh-01", name: "王璐", team: "中文审核", enabled: true },
  { id: "reviewer-fr-01", name: "Camille Martin", team: "法语审核", enabled: true },
  { id: "reviewer-es-01", name: "Lucía García", team: "西语审核", enabled: true },
  { id: "reviewer-ja-01", name: "松本遥", team: "日语审核", enabled: true },
  { id: "reviewer-ko-01", name: "김민준", team: "韩语审核", enabled: true },
  { id: "reviewer-tr-01", name: "Deniz Kaya", team: "土耳其语审核", enabled: true },
  { id: "reviewer-ru-01", name: "Анна Волкова", team: "俄语审核", enabled: true },
];

export const reviewOperatorName = (operatorId?: string) =>
  reviewOperators.find((operator) => operator.id === operatorId)?.name ||
  operatorId ||
  "—";
