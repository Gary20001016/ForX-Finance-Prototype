import { describe, expect, it } from "vitest";
import { createPagePermissions } from "./pagePermissions";
import type { ReviewOperator } from "./reviewOperators";
import type { TranslationItem } from "./types";
import {
  assignTranslationReviewer,
  canOperateAssignedTranslation,
  eligibleTranslationReviewers,
} from "./translationReviewAssignment";

const operator = (id: string, enabled = true): ReviewOperator => ({
  id,
  name: id,
  team: "语言审核",
  enabled,
  isSuperAdmin: false,
  pagePermissions: createPagePermissions(),
});

const item = {
  id: "MTI-1",
  status: "翻译返回待审核",
  specialReviewRequired: true,
  authorizedReviewerIds: ["author", "reviewer", "disabled"],
  submitter: "author",
} as TranslationItem;

describe("translation review assignment", () => {
  it("keeps an authorized submitter in the eligible reviewer pool", () => {
    expect(
      eligibleTranslationReviewers(item, [
        operator("author"),
        operator("reviewer"),
        operator("disabled", false),
      ]).map((candidate) => candidate.id),
    ).toEqual(["author", "reviewer"]);
  });

  it("randomly assigns exactly one eligible reviewer", () => {
    expect(
      assignTranslationReviewer(
        item,
        [operator("author"), operator("reviewer")],
        () => 0.9,
      ),
    ).toEqual({ assigneeId: "reviewer", assignee: "reviewer" });
  });

  it("allows only the assigned reviewer to operate", () => {
    const assigned = { ...item, assigneeId: "author", assignee: "author" };
    expect(canOperateAssignedTranslation(assigned, operator("author"))).toBe(true);
    expect(canOperateAssignedTranslation(assigned, operator("reviewer"))).toBe(false);
  });
});
