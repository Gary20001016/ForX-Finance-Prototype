import { describe, expect, it } from "vitest";
import {
  getEventTemplateVariables,
  getEventVariableDefinitions,
} from "./eventVariables";

describe("event variable definitions", () => {
  it("describes every deposit variable with an example", () => {
    const variables = getEventVariableDefinitions("deposit.credited");

    expect(variables.map((item) => item.name)).toEqual([
      "user_nickname",
      "amount",
      "currency",
      "network",
      "occurred_at",
    ]);
    expect(variables).toContainEqual({
      name: "network",
      description: "充值使用的区块链网络",
      example: "TRON",
    });
    expect(
      variables.every((item) => item.description && item.example),
    ).toBe(true);
  });

  it("converts selected event variables into explained picker entries", () => {
    expect(getEventTemplateVariables(["amount", "occurred_at"])).toEqual([
      expect.objectContaining({
        name: "amount",
        description: "事件对应的金额",
        status: "启用",
      }),
      expect.objectContaining({
        name: "occurred_at",
        description: "事件实际发生时间",
        status: "启用",
      }),
    ]);
  });
});
