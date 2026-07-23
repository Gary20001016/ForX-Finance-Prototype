import { describe, expect, it } from "vitest";
import {
  deriveTranslationBatchStatus,
  hasTranslationResult,
  isTranslationApproved,
  normalizeTranslationStatus,
} from "./translationStatus";

describe("translation status", () => {
  it("maps legacy workflow states into the three operator-facing states", () => {
    expect(normalizeTranslationStatus("翻译失败")).toBe("无结果");
    expect(normalizeTranslationStatus("翻译中")).toBe("无结果");
    expect(normalizeTranslationStatus("待小语种专审")).toBe(
      "翻译返回待审核",
    );
    expect(normalizeTranslationStatus("审核驳回")).toBe(
      "翻译返回待审核",
    );
    expect(normalizeTranslationStatus("审核通过")).toBe("已通过");
  });

  it("aggregates the batch by its least-complete active language", () => {
    expect(
      deriveTranslationBatchStatus([
        { status: "已通过" },
        { status: "无结果" },
      ]),
    ).toBe("无结果");
    expect(
      deriveTranslationBatchStatus([
        { status: "已通过" },
        { status: "翻译返回待审核" },
      ]),
    ).toBe("翻译返回待审核");
    expect(
      deriveTranslationBatchStatus([
        { status: "已通过" },
        { status: "已通过" },
      ]),
    ).toBe("已通过");
  });

  it("derives result availability and approval without extra states", () => {
    expect(hasTranslationResult("无结果")).toBe(false);
    expect(hasTranslationResult("翻译返回待审核")).toBe(true);
    expect(isTranslationApproved("翻译返回待审核")).toBe(false);
    expect(isTranslationApproved("已通过")).toBe(true);
  });
});
