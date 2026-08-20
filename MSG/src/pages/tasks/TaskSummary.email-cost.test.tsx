import { render, screen } from "@testing-library/react";
import {
  createDefaultEmailConfig,
  createDefaultEmailContent,
} from "../../domain/emailChannel";
import TaskSummary from "./TaskSummary";

it("shows the Email estimate for selected channels only", () => {
  render(
    <TaskSummary
      data={{
        name: "Email 成本预估",
        category: "announcement",
        topic: "maintenance",
        risk: "低",
        source: "临时消息",
        channels: ["邮件"],
        content: {
          sourceLocale: "zh-CN",
          locales: ["zh-CN"],
          web: { title: "", summary: "", body: "" },
          push: {
            title: "",
            body: "",
            platform: "全部设备",
            priority: "普通",
          },
          email: {
            ...createDefaultEmailContent(),
            subject: "邮件标题",
            textBody: "邮件正文",
          },
          emailConfig: createDefaultEmailConfig(),
        },
        audienceCount: 300_000,
        audienceLabel: "全部有效用户",
        schedule: "立即",
        expiresAt: "发送后 24 小时",
        translationReady: true,
        contentMode: "temporary",
        triggerType: "manual",
      }}
    />,
  );

  expect(
    screen.getByText("Email 预计 ¥1,143.6（285,900 封 × ¥0.004）"),
  ).toBeVisible();
  expect(screen.queryByText("Web ¥0")).not.toBeInTheDocument();
  expect(screen.queryByText("Push ¥0")).not.toBeInTheDocument();
});
