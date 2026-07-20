import { beforeEach, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  getPrototypeState,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("submits a Japanese-only template to direct language review", async () => {
  const user = userEvent.setup();
  const onCreated = vi.fn();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
      onCreated={onCreated}
    />,
  );

  await user.type(screen.getByPlaceholderText("后台识别名称"), "日文单语言模板");
  await user.click(screen.getByLabelText("默认语言"));
  fireEvent.click(await screen.findByText("ja-JP"));
  await user.type(screen.getByLabelText("站内信标题"), "お知らせ");
  await user.type(screen.getByLabelText("站内信摘要"), "概要");
  await user.type(screen.getByLabelText("Markdown 站内信正文"), "本文");
  await user.type(screen.getByLabelText("Push 标题"), "お知らせ");
  await user.type(screen.getByLabelText("Push 正文"), "本文");

  expect(screen.getByText(/单语言模板，无需机器翻译/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "提交语言审核" }));

  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  const template = onCreated.mock.calls[0][0];
  expect(template.sourceLocale).toBe("ja-JP");
  expect(template.locales).toEqual(["ja-JP"]);
  expect(
    getPrototypeState().translationBatches.find(
      (batch) => batch.templateId === template.id,
    ),
  ).toMatchObject({ productionMode: "direct_source_review" });
});

it("excludes the source locale from target-language options", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  await user.click(screen.getByLabelText("默认语言"));
  fireEvent.click(await screen.findByText("ja-JP"));
  await user.click(screen.getByLabelText("目标语言"));

  const popups = document.querySelectorAll(".arco-select-popup");
  const targetPopup = popups[popups.length - 1] as HTMLElement;
  expect(within(targetPopup).queryByText("ja-JP")).not.toBeInTheDocument();
  expect(within(targetPopup).getByText("en-US")).toBeVisible();
});

it("derives a read-only message nature from the selected category", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  const natureField = screen.getByText("消息性质").closest(".arco-form-item");
  expect(natureField?.querySelector(".arco-select")).not.toBeInTheDocument();
  expect(natureField?.querySelector("input")).toBeDisabled();
  expect(natureField?.querySelector("input")).toHaveValue("服务");

  const categoryField = screen.getByText("消息分类").closest(".arco-form-item");
  const categorySelect = categoryField?.querySelector(".arco-select");
  expect(categorySelect).toBeTruthy();
  await user.click(categorySelect as HTMLElement);
  fireEvent.click(await screen.findByText("活动通知"));

  expect(natureField?.querySelector("input")).toHaveValue("营销");
});

it("defaults a new template risk level to low", () => {
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  const riskField = screen.getByText("风险等级").closest(".arco-form-item");
  expect(riskField).toHaveTextContent("低");
  expect(riskField).not.toHaveTextContent("中");
});
