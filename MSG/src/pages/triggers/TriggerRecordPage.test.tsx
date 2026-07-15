import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { resetPrototypeStore } from "../../store/prototypeStore";
import TriggerRecordPage from "./TriggerRecordPage";

beforeEach(() => resetPrototypeStore());

it("shows each event execution independently from its long-lived rule", () => {
  render(<TriggerRecordPage />);

  expect(screen.getByRole("heading", { name: "触发记录" })).toBeVisible();
  expect(screen.getAllByText("TRG-260714-001").length).toBeGreaterThan(0);
  expect(screen.getByText("幂等键")).toBeVisible();
  expect(screen.getAllByText("已完成").length).toBeGreaterThan(0);
});
