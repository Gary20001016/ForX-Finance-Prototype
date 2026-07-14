export interface UidInvalidRow {
  row: number;
  uid: string;
  reason: string;
}

export interface UidCsvParseResult {
  totalRows: number;
  validUids: string[];
  invalidRows: UidInvalidRow[];
  duplicateCount: number;
}

export interface UidAudienceMergeResult {
  finalUids: string[];
  crossSourceDuplicateCount: number;
}

export const UID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const UID_CSV_TEMPLATE =
  "uid,remark\n10000001,活动报名用户\n10000002,VIP 用户\n";

export function parseManualUids(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
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

export function parseUidCsv(text: string): UidCsvParseResult {
  const rows = parseRows(text.replace(/^\uFEFF/, ""));
  if (!rows.length) throw new Error("CSV 文件为空");

  const headers = rows[0].map((value) => value.trim().toLowerCase());
  const uidIndex = headers.indexOf("uid");
  if (uidIndex < 0) throw new Error("CSV 必须包含 uid 列");

  const dataRows = rows
    .slice(1)
    .map((values, index) => ({ values, row: index + 2 }))
    .filter(({ values }) => values.some((value) => value.trim()));
  if (!dataRows.length) throw new Error("CSV 中没有可导入 UID");
  if (dataRows.length > 100_000)
    throw new Error("CSV 数据不能超过 100,000 行");

  const seen = new Set<string>();
  const validUids: string[] = [];
  const invalidRows: UidInvalidRow[] = [];
  let duplicateCount = 0;

  dataRows.forEach(({ values, row }) => {
    const uid = (values[uidIndex] || "").trim();
    if (!uid) {
      invalidRows.push({ row, uid, reason: "UID 不能为空" });
    } else if (!UID_PATTERN.test(uid)) {
      invalidRows.push({ row, uid, reason: "UID 格式错误" });
    } else if (seen.has(uid)) {
      duplicateCount += 1;
    } else {
      seen.add(uid);
      validUids.push(uid);
    }
  });

  return {
    totalRows: dataRows.length,
    validUids,
    invalidRows,
    duplicateCount,
  };
}

export function mergeUidAudience(
  manualUids: string[],
  csvValidUids: string[],
  csvConfirmed: boolean,
): UidAudienceMergeResult {
  const finalUids = [...manualUids];
  const seen = new Set(manualUids);
  let crossSourceDuplicateCount = 0;

  if (csvConfirmed) {
    csvValidUids.forEach((uid) => {
      if (seen.has(uid)) {
        crossSourceDuplicateCount += 1;
      } else {
        seen.add(uid);
        finalUids.push(uid);
      }
    });
  }

  return { finalUids, crossSourceDuplicateCount };
}

export function maskUid(uid: string): string {
  return uid.length <= 4 ? "***" : `${uid.slice(0, 2)}***${uid.slice(-2)}`;
}

export function createUidErrorCsv(rows: UidInvalidRow[]): string {
  return [
    "row,uid,reason",
    ...rows.map(
      (item) => `${item.row},${maskUid(item.uid)},${item.reason}`,
    ),
  ].join("\n");
}
