import type { ControlledTemplateVariable } from "./types";

export const VARIABLE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
export const VARIABLE_CSV_TEMPLATE =
  "variable_name,description\nuser_nickname,用户昵称\nvip_level,用户 VIP 等级\n";

const TOKEN_PATTERN = /\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g;

export interface VariableValidationResult {
  valid: boolean;
  invalid: string[];
  inactive: string[];
  malformed: boolean;
}

export interface VariableCsvRow {
  row: number;
  name: string;
  description: string;
  operation: "新增" | "更新";
}

export interface VariableCsvError {
  row: number;
  name: string;
  reason: string;
}

export interface VariableCsvPreview {
  totalRows: number;
  validRows: VariableCsvRow[];
  errors: VariableCsvError[];
  createCount: number;
  updateCount: number;
  errorCount: number;
}

export const variableToken = (name: string) => `{{ ${name} }}`;

export function extractVariableNames(text: string): string[] {
  return Array.from(text.matchAll(TOKEN_PATTERN), (match) => match[1]);
}

export function validateVariableTokens(
  text: string,
  variables: ControlledTemplateVariable[],
): VariableValidationResult {
  const names = extractVariableNames(text);
  const byName = new Map(variables.map((item) => [item.name, item]));
  const invalid = Array.from(
    new Set(names.filter((name) => !byName.has(name))),
  );
  const inactive = Array.from(
    new Set(
      names.filter((name) => byName.get(name)?.status === "停用"),
    ),
  );
  const unmatched = text.replace(TOKEN_PATTERN, "");
  const malformed = unmatched.includes("{{") || unmatched.includes("}}");

  return {
    valid: !invalid.length && !inactive.length && !malformed,
    invalid,
    inactive,
    malformed,
  };
}

export function insertVariableToken(
  value: string,
  name: string,
  selectionStart = value.length,
  selectionEnd = selectionStart,
) {
  const token = variableToken(name);
  return {
    value: `${value.slice(0, selectionStart)}${token}${value.slice(selectionEnd)}`,
    cursor: selectionStart + token.length,
  };
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r" || quoted) {
      cell += character;
    }
  }

  if (quoted) throw new Error("CSV 存在未闭合的引号");
  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

export function parseVariableCsv(
  text: string,
  variables: ControlledTemplateVariable[],
): VariableCsvPreview {
  const rows = parseRows(text.replace(/^\uFEFF/, ""));
  if (!rows.length) throw new Error("CSV 文件为空");
  const headers = rows[0].map((value) => value.trim().toLowerCase());
  const nameIndex = headers.indexOf("variable_name");
  const descriptionIndex = headers.indexOf("description");
  if (nameIndex < 0 || descriptionIndex < 0) {
    throw new Error("CSV 必须包含 variable_name、description 列");
  }

  const dataRows = rows
    .slice(1)
    .map((values, index) => ({ values, row: index + 2 }))
    .filter(({ values }) => values.some((value) => value.trim()));
  if (!dataRows.length) throw new Error("CSV 中没有可导入变量");

  const existing = new Set(variables.map((item) => item.name));
  const seen = new Set<string>();
  const validRows: VariableCsvRow[] = [];
  const errors: VariableCsvError[] = [];

  dataRows.forEach(({ values, row }) => {
    const name = (values[nameIndex] || "").trim();
    const description = (values[descriptionIndex] || "").trim();
    if (!VARIABLE_NAME_PATTERN.test(name)) {
      errors.push({ row, name, reason: "变量名必须使用 snake_case" });
    } else if (seen.has(name)) {
      errors.push({ row, name, reason: "同一文件内变量名重复" });
    } else if (!description) {
      errors.push({ row, name, reason: "变量说明不能为空" });
    } else {
      seen.add(name);
      validRows.push({
        row,
        name,
        description,
        operation: existing.has(name) ? "更新" : "新增",
      });
    }
  });

  const createCount = validRows.filter(
    (item) => item.operation === "新增",
  ).length;
  const updateCount = validRows.length - createCount;
  return {
    totalRows: dataRows.length,
    validRows,
    errors,
    createCount,
    updateCount,
    errorCount: errors.length,
  };
}
