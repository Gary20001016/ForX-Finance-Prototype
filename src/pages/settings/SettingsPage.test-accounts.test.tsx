import { beforeEach, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetPrototypeStore } from "../../store/prototypeStore";
import SettingsPage from "./SettingsPage";

beforeEach(() => {
  resetPrototypeStore();
  window.history.pushState({}, "", "/settings?tab=test-accounts");
});

it("opens the personal test account tab from the settings query parameter", () => {
  render(<SettingsPage />);

  expect(screen.getByRole("tab", { name: "测试账号" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByText("2 / 4")).toBeVisible();
  expect(screen.getByText("UID-TEST-9001")).toBeVisible();
  expect(screen.getByText("UID-TEST-9002")).toBeVisible();
});

it("adds a test UID for the current operator", async () => {
  const user = userEvent.setup();
  render(<SettingsPage />);

  await user.click(screen.getByRole("button", { name: "新增测试账号" }));
  await user.type(screen.getByPlaceholderText("输入用户 UID"), "UID-TEST-9003");
  await user.type(screen.getByPlaceholderText("例如：备用 iPhone"), "备用设备");
  await user.click(screen.getByRole("button", { name: "保存测试账号" }));

  expect(await screen.findByText("UID-TEST-9003")).toBeVisible();
  expect(screen.getByText("3 / 4")).toBeVisible();
});
