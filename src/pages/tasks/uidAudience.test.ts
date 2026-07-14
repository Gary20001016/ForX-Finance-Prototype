import { describe, expect, it } from "vitest";
import {
  createUidErrorCsv,
  maskUid,
  mergeUidAudience,
  parseManualUids,
  parseUidCsv,
} from "./uidAudience";

describe("UID audience parsing", () => {
  it("parses the uid column, quoted values and UTF-8 BOM", () => {
    const result = parseUidCsv(
      '\uFEFFuid,remark\n100001,"first, row"\nUSER-02,second',
    );

    expect(result).toMatchObject({
      totalRows: 2,
      validUids: ["100001", "USER-02"],
      duplicateCount: 0,
      invalidRows: [],
    });
  });

  it("excludes invalid rows and counts duplicates", () => {
    const result = parseUidCsv(
      "uid,remark\n100001,first\n100001,duplicate\nbad uid,invalid\n,empty",
    );

    expect(result.validUids).toEqual(["100001"]);
    expect(result.duplicateCount).toBe(1);
    expect(result.invalidRows).toEqual([
      { row: 4, uid: "bad uid", reason: "UID 格式错误" },
      { row: 5, uid: "", reason: "UID 不能为空" },
    ]);
  });

  it("rejects a CSV without the uid header", () => {
    expect(() => parseUidCsv("user_id\n100001")).toThrow(
      "CSV 必须包含 uid 列",
    );
  });

  it("rejects unclosed quoted fields", () => {
    expect(() => parseUidCsv('uid,remark\n100001,"unclosed')).toThrow(
      "CSV 存在未闭合的引号",
    );
  });

  it("merges manual and confirmed CSV UIDs without duplicates", () => {
    const manual = parseManualUids("100001\n100002\n100001\n");

    expect(
      mergeUidAudience(manual, ["100002", "100003"], false).finalUids,
    ).toEqual(["100001", "100002"]);
    expect(
      mergeUidAudience(manual, ["100002", "100003"], true),
    ).toEqual({
      finalUids: ["100001", "100002", "100003"],
      crossSourceDuplicateCount: 1,
    });
  });

  it("masks UID values in samples and error CSV", () => {
    expect(maskUid("12345678")).toBe("12***78");
    expect(
      createUidErrorCsv([
        { row: 3, uid: "12345678", reason: "UID 格式错误" },
      ]),
    ).toContain("3,12***78,UID 格式错误");
  });
});
