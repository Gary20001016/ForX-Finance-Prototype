import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { getPrototypeState, resetPrototypeStore } from "../../store/prototypeStore";
import LanguageReviewPolicyPanel from "./LanguageReviewPolicyPanel";

beforeEach(() => resetPrototypeStore());

it("configures which languages require standalone review", () => {
  render(<LanguageReviewPolicyPanel />);

  expect(screen.getByText("日语")).toBeInTheDocument();
  expect(screen.getByText("授权审核人")).toBeInTheDocument();
  expect(screen.getByText(/松本遥 · reviewer-ja-01/)).toBeInTheDocument();
  const frenchSwitch = screen.getByRole("switch", { name: "法语专项审核" });
  fireEvent.click(frenchSwitch);

  expect(
    getPrototypeState().languageReviewPolicies.find(
      (policy) => policy.localeCode === "fr-FR",
    )?.specialReviewRequired,
  ).toBe(true);
});
