import { render, screen, within } from "@testing-library/react";
import MessagePreview from "./MessagePreview";

const content = {
  sourceLocale: "zh-CN",
  locales: ["zh-CN"],
  web: {
    title: "统一站内信标题",
    summary: "Web 和 App 共用摘要",
    body: "Web 和 App 共用正文",
    actionText: "查看详情",
    targetUrl: "forxfinance://messages/MSG-001",
  },
  push: {
    title: "独立 Push 标题",
    body: "Push 通知正文",
    platform: "全部设备" as const,
    priority: "高" as const,
    deepLink: "forxfinance://messages/MSG-001",
  },
};

it("previews shared inbox content on Web and App separately from App Push", () => {
  render(<MessagePreview content={content} />);

  const webInbox = screen.getByRole("region", { name: "Web 站内信预览" });
  const appInbox = screen.getByRole("region", { name: "App 站内信预览" });
  const appPush = screen.getByRole("region", { name: "App Push 预览" });

  expect(within(webInbox).getByText("统一站内信标题")).toBeVisible();
  expect(within(appInbox).getByText("统一站内信标题")).toBeVisible();
  expect(within(appPush).getByText("独立 Push 标题")).toBeVisible();
});

it("hides Push priority metadata for artificial messages", () => {
  render(<MessagePreview content={content} showPushPriority={false} />);

  const appPush = screen.getByRole("region", { name: "App Push 预览" });
  expect(within(appPush).getByText("全部设备")).toBeVisible();
  expect(within(appPush).queryByText("高")).not.toBeInTheDocument();
});
