import { describe, expect, it } from "vitest";
import type { AudienceSegment } from "../../domain/types";
import { buildSegmentEditChanges } from "./segmentEditLog";

const baseSegment: AudienceSegment = {
  id: "SEG-101",
  name: "近30天沉默交易用户",
  type: "动态条件",
  purpose: "营销",
  count: 328400,
  change: 4.8,
  refresh: "每小时",
  updatedAt: "18:00",
  owner: "增长运营",
  status: "可用",
  rule: "30天无成交 AND 资产 ≥ 100 USDT",
};

const sourceSegments: AudienceSegment[] = [
  baseSegment,
  {
    ...baseSegment,
    id: "SEG-102",
    name: "ETH 活跃用户",
  },
];

describe("buildSegmentEditChanges", () => {
  it("creates a complete field set for a new segment", () => {
    const changes = buildSegmentEditChanges(undefined, baseSegment, sourceSegments);

    expect(changes).toEqual(
      expect.arrayContaining([
        { field: "分群名称", before: "—", after: "近30天沉默交易用户" },
        { field: "分群类型", before: "—", after: "动态条件" },
        { field: "规则摘要", before: "—", after: "30天无成交 AND 资产 ≥ 100 USDT" },
      ]),
    );
  });

  it("returns only fields changed by an edit", () => {
    const changes = buildSegmentEditChanges(
      baseSegment,
      {
        ...baseSegment,
        name: "30天未交易且有余额用户",
        refresh: "每日",
      },
      sourceSegments,
    );

    expect(changes).toEqual([
      {
        field: "分群名称",
        before: "近30天沉默交易用户",
        after: "30天未交易且有余额用户",
      },
      { field: "数据刷新", before: "每小时", after: "每日" },
    ]);
  });

  it("formats combined segment operation and source names", () => {
    const combined: AudienceSegment = {
      ...baseSegment,
      id: "SEG-200",
      name: "组合受众",
      type: "组合分群",
      rule: "近30天沉默交易用户 ∩ ETH 活跃用户",
      setOperation: "intersection",
      sourceSegmentIds: ["SEG-101", "SEG-102"],
    };

    const changes = buildSegmentEditChanges(undefined, combined, sourceSegments);

    expect(changes).toEqual(
      expect.arrayContaining([
        { field: "集合运算", before: "—", after: "交集" },
        {
          field: "来源分群",
          before: "—",
          after: "近30天沉默交易用户、ETH 活跃用户",
        },
      ]),
    );
  });

  it("returns no changes when the editable fields are unchanged", () => {
    expect(
      buildSegmentEditChanges(baseSegment, { ...baseSegment }, sourceSegments),
    ).toEqual([]);
  });
});
