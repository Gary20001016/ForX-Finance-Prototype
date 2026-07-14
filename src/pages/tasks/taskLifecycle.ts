import type {
  ManualTaskDeliveryResult,
  ManualTaskOperation,
  ManualTaskStatus,
  ManualTaskSystemAction,
} from "../../domain/types";

export const MANUAL_TASK_STATUSES: ManualTaskStatus[] = [
  "草稿",
  "待审核",
  "待修改",
  "待发送",
  "发送中",
  "已暂停",
  "已完成",
  "已取消",
  "已过期",
];

const OPERATION_MAP: Record<ManualTaskStatus, ManualTaskOperation[]> = {
  草稿: ["查看详情", "编辑任务", "复制任务", "取消任务"],
  待审核: ["查看详情", "复制任务", "撤回审核", "取消任务"],
  待修改: ["查看详情", "编辑任务", "复制任务", "取消任务"],
  待发送: ["查看详情", "编辑任务", "复制任务", "取消任务"],
  发送中: ["查看详情", "复制任务", "暂停发送", "取消任务"],
  已暂停: ["查看详情", "复制任务", "恢复发送", "取消任务"],
  已完成: ["查看详情", "复制任务"],
  已取消: ["查看详情", "复制任务"],
  已过期: ["查看详情", "复制任务"],
};

type TransitionAction = ManualTaskOperation | ManualTaskSystemAction;

const TRANSITIONS: Partial<
  Record<
    ManualTaskStatus,
    Partial<Record<TransitionAction, ManualTaskStatus>>
  >
> = {
  草稿: { 提交审核: "待审核", 取消任务: "已取消" },
  待审核: {
    撤回审核: "草稿",
    驳回审核: "待修改",
    取消任务: "已取消",
  },
  待修改: { 提交审核: "待审核", 取消任务: "已取消" },
  待发送: {
    编辑任务: "草稿",
    系统启动发送: "发送中",
    系统标记过期: "已过期",
    取消任务: "已取消",
  },
  发送中: {
    暂停发送: "已暂停",
    系统完成发送: "已完成",
    系统终止发送: "已取消",
    取消任务: "已取消",
  },
  已暂停: {
    恢复发送: "发送中",
    系统标记过期: "已过期",
    系统终止发送: "已取消",
    取消任务: "已取消",
  },
};

export const isManualTaskStatus = (
  status: string,
): status is ManualTaskStatus =>
  MANUAL_TASK_STATUSES.includes(status as ManualTaskStatus);

export const canEditManualTask = (status: ManualTaskStatus) =>
  status === "草稿" || status === "待修改" || status === "待发送";

export const getManualTaskOperations = (task: {
  status: ManualTaskStatus;
  deliveryResult?: ManualTaskDeliveryResult;
}): ManualTaskOperation[] => {
  const operations = [...OPERATION_MAP[task.status]];
  if (
    task.status === "已完成" &&
    (task.deliveryResult === "部分失败" || task.deliveryResult === "失败")
  ) {
    operations.push("重试失败项");
  }
  return operations;
};

export const transitionManualTask = (
  status: ManualTaskStatus,
  action: TransitionAction,
): ManualTaskStatus => TRANSITIONS[status]?.[action] || status;
