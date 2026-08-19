import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { createEmailHtmlAsset } from "../../domain/emailChannel";
import type { LocalizedMessageContent } from "../../domain/types";
import {
  createTranslationBatch,
  getPrototypeState,
  resetPrototypeStore,
  updateLanguageReviewPolicy,
} from "../../store/prototypeStore";
import TranslationReviewDrawer from "./TranslationReviewDrawer";

beforeEach(() => resetPrototypeStore());

const makeContent = (): LocalizedMessageContent => ({
  sourceLocale: "zh-CN",
  locales: ["zh-CN", "ja-JP"],
  web: { title: "", summary: "", body: "" },
  push: { title: "", body: "", platform: "全部设备", priority: "普通" },
  email: {
    subject: "夏季 VIP 专属礼遇",
    preheader: "限时领取奖励",
    bodyMode: "html",
    htmlAssets: {},
    headline: "",
    body: "",
    textBody: "",
    unsubscribeText: "取消订阅",
  },
  emailConfig: {
    emailType: "营销邮件",
    senderProfileId: "marketing",
    fromName: "ForX Finance 活动",
    trackingEnabled: true,
    unsubscribeRequired: true,
  },
});

const createHtmlReviewItem = (blocked = false) => {
  updateLanguageReviewPolicy("ja-JP", {
    specialReviewRequired: true,
    authorizedReviewerIds: ["admin-01"],
  });
  const sourceContent = makeContent();
  const batch = createTranslationBatch({
    subject: {
      type: "manual_task_content",
      id: "TASK-HTML-JA",
      name: "夏季 VIP 专属礼遇 Email · 日语 HTML 审核",
      version: "draft-1",
      returnPath: "/tasks/create",
    },
    sourceLocale: "zh-CN",
    sourceContent: { title: "夏季 VIP 专属礼遇", summary: "限时领取奖励" },
    sourceChannelContent: sourceContent,
    channels: ["邮件"],
    targetLocales: ["ja-JP"],
    createdBy: "operator-01",
  });
  const item = getPrototypeState().translationBatches.find(
    (candidate) => candidate.id === batch.id,
  )!.items[0];
  const asset = createEmailHtmlAsset({
    locale: "ja-JP",
    fileName: "vip-summer-ja-JP.html",
    fileSize: 720,
    html: "<!doctype html><html><head><title>VIP</title></head><body><p>日本語 HTML 完成稿</p><a href=\"{{ unsubscribe_url }}\">配信停止</a></body></html>",
    emailType: "营销邮件",
    declaredVariables: [],
    uploadedBy: "operator-01",
  });
  if (blocked) asset.validationStatus = "blocked";
  item.humanDraft = { title: "夏季 VIP 特典", summary: "期間限定特典" };
  item.humanChannelDraft = {
    email: {
      subject: "夏季 VIP 特典",
      preheader: "期間限定特典",
      bodyMode: "html",
      htmlAssets: { "ja-JP": asset },
    },
  };
  item.assigneeId = "admin-01";
  item.assignee = "Gary Ma";
  return item;
};

it("reviews an uploaded target-language HTML body without a Markdown editor", () => {
  const item = createHtmlReviewItem();

  render(
    <TranslationReviewDrawer
      item={item}
      visible
      onClose={() => undefined}
      currentAdmin="admin-01"
      reviewMode="special"
    />,
  );

  expect(screen.getByLabelText("Email HTML 桌面预览")).toBeVisible();
  expect(screen.getByLabelText("Email HTML 移动预览")).toBeVisible();
  expect(screen.getByText("vip-summer-ja-JP.html")).toBeVisible();
  expect(screen.queryByText("正文 Markdown")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "专项审核通过" })).toBeEnabled();
});

it("blocks approval when the target-language HTML validation failed", () => {
  const item = createHtmlReviewItem(true);

  render(
    <TranslationReviewDrawer
      item={item}
      visible
      onClose={() => undefined}
      currentAdmin="admin-01"
      reviewMode="special"
    />,
  );

  expect(screen.getByText("HTML 校验未通过")).toBeVisible();
  expect(screen.getByRole("button", { name: "专项审核通过" })).toBeDisabled();
});
