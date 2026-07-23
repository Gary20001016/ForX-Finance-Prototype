import { describe, expect, it } from "vitest";
import type { AudienceSegment } from "../../domain/types";
import {
  estimateSegmentSetCount,
  segmentSetExpression,
} from "./segmentSetOperations";

const segmentFixtures: AudienceSegment[] = [
  {
    id: "SEG-101",
    name: "近30天沉默交易用户",
    type: "动态条件",
    purpose: "营销",
    count: 328400,
    change: 0,
    refresh: "每小时",
    updatedAt: "刚刚",
    owner: "增长运营",
    status: "可用",
    rule: "30天无成交",
  },
  {
    id: "SEG-102",
    name: "ETH 活跃用户",
    type: "动态条件",
    purpose: "服务",
    count: 842100,
    change: 0,
    refresh: "每小时",
    updatedAt: "刚刚",
    owner: "资产运营",
    status: "可用",
    rule: "近90天 ETH 活跃",
  },
  {
    id: "SEG-104",
    name: "沉默交易且 ETH 活跃用户",
    type: "组合分群",
    purpose: "营销",
    count: 197040,
    change: 0,
    refresh: "每日",
    updatedAt: "刚刚",
    owner: "增长运营",
    status: "可用",
    rule: "近30天沉默交易用户 ∩ ETH 活跃用户",
    setOperation: "intersection",
    sourceSegmentIds: ["SEG-101", "SEG-102"],
  },
  {
    id: "SEG-106",
    name: "嵌套组合用户",
    type: "组合分群",
    purpose: "营销",
    count: 100000,
    change: 0,
    refresh: "每日",
    updatedAt: "刚刚",
    owner: "增长运营",
    status: "可用",
    rule: "（近30天沉默交易用户 ∩ ETH 活跃用户）∪ 其他用户",
    setOperation: "union",
    sourceSegmentIds: ["SEG-104"],
  },
];

describe("segment set operations", () => {
  it("renders a union expression with the selected segment names", () => {
    expect(
      segmentSetExpression(
        segmentFixtures,
        ["SEG-101", "SEG-102"],
        "union",
      ),
    ).toBe("近30天沉默交易用户 ∪ ETH 活跃用户");
  });

  it("renders an intersection expression with the selected segment names", () => {
    expect(
      segmentSetExpression(
        segmentFixtures,
        ["SEG-101", "SEG-102"],
        "intersection",
      ),
    ).toBe("近30天沉默交易用户 ∩ ETH 活跃用户");
  });

  it("estimates union and intersection counts", () => {
    expect(
      estimateSegmentSetCount(
        segmentFixtures,
        ["SEG-101", "SEG-102"],
        "union",
      ),
    ).toBe(1170500);
    expect(
      estimateSegmentSetCount(
        segmentFixtures,
        ["SEG-101", "SEG-102"],
        "intersection",
      ),
    ).toBe(197040);
  });

  it("preserves a combined source as a parenthesized nested expression", () => {
    expect(
      segmentSetExpression(
        segmentFixtures,
        ["SEG-104", "SEG-101"],
        "union",
      ),
    ).toBe(
      "（近30天沉默交易用户 ∩ ETH 活跃用户） ∪ 近30天沉默交易用户",
    );
  });

  it("detects direct and indirect segment dependencies", async () => {
    const operations = (await import("./segmentSetOperations")) as unknown as {
      segmentDependsOn?: (
        segments: AudienceSegment[],
        candidateId: string,
        targetId: string,
      ) => boolean;
    };

    expect(operations.segmentDependsOn).toBeTypeOf("function");
    expect(
      operations.segmentDependsOn?.(segmentFixtures, "SEG-104", "SEG-101"),
    ).toBe(true);
    expect(
      operations.segmentDependsOn?.(segmentFixtures, "SEG-106", "SEG-101"),
    ).toBe(true);
    expect(
      operations.segmentDependsOn?.(segmentFixtures, "SEG-101", "SEG-104"),
    ).toBe(false);
  });
});
