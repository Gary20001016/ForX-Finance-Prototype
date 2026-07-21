import { expect, it } from "vitest";
import * as prototypeStore from "./prototypeStore";

it("backfills authorized reviewers when migrating legacy language policies", () => {
  const normalize = (
    prototypeStore as unknown as Record<string, unknown>
  ).normalizeLanguageReviewPolicies;

  expect(normalize).toBeTypeOf("function");
  if (typeof normalize !== "function") return;

  const [english] = normalize([
    {
      localeCode: "en-US",
      localeName: "英语",
      specialReviewRequired: false,
      reviewerCount: 1,
      allowSubmitterReview: true,
      reviewSlaHours: 8,
      timeoutAction: "提醒",
      enabled: true,
    },
  ]);

  expect(english.authorizedReviewerIds).toEqual([
    "admin-01",
    "reviewer-en-01",
  ]);
});
