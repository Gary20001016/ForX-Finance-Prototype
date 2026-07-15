import {
  MANUAL_TASK_STATUSES,
  canEditManualTask,
  getManualTaskOperations,
  transitionManualTask,
} from "./taskLifecycle";

describe("人工消息任务生命周期", () => {
  it("uses exactly the nine standardized task states", () => {
    expect(MANUAL_TASK_STATUSES).toEqual([
      "草稿",
      "待审核",
      "待修改",
      "待发送",
      "发送中",
      "已暂停",
      "已完成",
      "已取消",
      "已过期",
    ]);
  });

  it("only allows editing draft, modification and scheduled tasks", () => {
    expect(canEditManualTask("草稿")).toBe(true);
    expect(canEditManualTask("待修改")).toBe(true);
    expect(canEditManualTask("待发送")).toBe(true);
    expect(canEditManualTask("待审核")).toBe(false);
    expect(canEditManualTask("发送中")).toBe(false);
    expect(canEditManualTask("已暂停")).toBe(false);
    expect(canEditManualTask("已完成")).toBe(false);
    expect(canEditManualTask("已取消")).toBe(false);
    expect(canEditManualTask("已过期")).toBe(false);
  });

  it("returns standardized operations for each state", () => {
    expect(getManualTaskOperations({ status: "待审核" })).toEqual([
      "查看详情",
      "复制任务",
      "撤回审核",
      "取消任务",
    ]);
    expect(getManualTaskOperations({ status: "发送中" })).toEqual([
      "查看详情",
      "复制任务",
      "暂停发送",
      "取消任务",
    ]);
    expect(getManualTaskOperations({ status: "已暂停" })).toEqual([
      "查看详情",
      "复制任务",
      "恢复发送",
      "取消任务",
    ]);
    expect(getManualTaskOperations({ status: "已取消" })).toEqual([
      "查看详情",
      "复制任务",
    ]);
  });

  it("only offers failed-item retry for completed tasks with failed outcomes", () => {
    expect(
      getManualTaskOperations({
        status: "已完成",
        deliveryResult: "成功",
      }),
    ).toEqual(["查看详情", "复制任务"]);
    expect(
      getManualTaskOperations({
        status: "已完成",
        deliveryResult: "部分失败",
      }),
    ).toEqual(["查看详情", "复制任务", "重试失败项"]);
    expect(
      getManualTaskOperations({
        status: "已完成",
        deliveryResult: "失败",
      }),
    ).toEqual(["查看详情", "复制任务", "重试失败项"]);
  });

  it("applies user and system transitions without mixing delivery results", () => {
    expect(transitionManualTask("草稿", "提交审核")).toBe("待审核");
    expect(transitionManualTask("待审核", "撤回审核")).toBe("草稿");
    expect(transitionManualTask("待修改", "提交审核")).toBe("待审核");
    expect(transitionManualTask("待发送", "编辑任务")).toBe("草稿");
    expect(transitionManualTask("待发送", "系统启动发送")).toBe(
      "发送中",
    );
    expect(transitionManualTask("发送中", "暂停发送")).toBe("已暂停");
    expect(transitionManualTask("已暂停", "恢复发送")).toBe("发送中");
    expect(transitionManualTask("发送中", "系统完成发送")).toBe(
      "已完成",
    );
    expect(transitionManualTask("待发送", "系统标记过期")).toBe(
      "已过期",
    );
    expect(transitionManualTask("发送中", "取消任务")).toBe("已取消");
  });

  it("keeps the original state for read-only or invalid operations", () => {
    expect(transitionManualTask("已完成", "查看详情")).toBe("已完成");
    expect(transitionManualTask("已完成", "复制任务")).toBe("已完成");
    expect(transitionManualTask("已取消", "恢复发送")).toBe("已取消");
  });
});
