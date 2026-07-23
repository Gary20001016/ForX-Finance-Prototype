import { describe, expect, it } from "vitest";
import type { ControlledTemplateVariable } from "./types";
import {
  extractVariableNames,
  insertVariableToken,
  parseVariableCsv,
  validateVariableTokens,
} from "./manualMessageVariables";

const variables: ControlledTemplateVariable[] = [
  {
    id: "VAR-001",
    name: "user_nickname",
    description: "用户昵称",
    status: "启用",
    updatedAt: "刚刚",
    updatedBy: "Gary Ma",
  },
  {
    id: "VAR-002",
    name: "disabled_key",
    description: "停用变量",
    status: "停用",
    updatedAt: "刚刚",
    updatedBy: "Gary Ma",
  },
];

describe("manual message controlled variables", () => {
  it("extracts every variable occurrence in source order", () => {
    expect(
      extractVariableNames(
        "Hi {{ user_nickname }}，再次欢迎 {{user_nickname}}。",
      ),
    ).toEqual(["user_nickname", "user_nickname"]);
  });

  it("validates missing, inactive and malformed tokens", () => {
    expect(validateVariableTokens("{{ user_nickname }}", variables)).toEqual({
      valid: true,
      invalid: [],
      inactive: [],
      malformed: false,
    });
    expect(validateVariableTokens("{{ missing_key }}", variables)).toEqual({
      valid: false,
      invalid: ["missing_key"],
      inactive: [],
      malformed: false,
    });
    expect(validateVariableTokens("{{ disabled_key }}", variables)).toEqual({
      valid: false,
      invalid: [],
      inactive: ["disabled_key"],
      malformed: false,
    });
    expect(validateVariableTokens("{{ user_nickname }", variables)).toEqual({
      valid: false,
      invalid: [],
      inactive: [],
      malformed: true,
    });
  });

  it("inserts a complete token at the current selection", () => {
    expect(insertVariableToken("欢迎名字", "user_nickname", 2, 4)).toEqual({
      value: "欢迎{{ user_nickname }}",
      cursor: 21,
    });
  });

  it("previews CSV creates, updates and invalid rows", () => {
    const preview = parseVariableCsv(
      [
        "variable_name,description",
        "user_nickname,展示昵称",
        "vip_level,用户 VIP 等级",
        "Bad-Key,错误格式",
        "vip_level,重复行",
        "empty_description,",
      ].join("\n"),
      variables,
    );

    expect(preview.createCount).toBe(1);
    expect(preview.updateCount).toBe(1);
    expect(preview.errorCount).toBe(3);
    expect(preview.validRows.map((item) => item.name)).toEqual([
      "user_nickname",
      "vip_level",
    ]);
    expect(preview.errors.map((item) => item.reason)).toEqual([
      "变量名必须使用 snake_case",
      "同一文件内变量名重复",
      "变量说明不能为空",
    ]);
  });

  it("requires the two controlled CSV headers", () => {
    expect(() =>
      parseVariableCsv("name,description\nuser_nickname,用户昵称", variables),
    ).toThrow("CSV 必须包含 variable_name、description 列");
  });
});
