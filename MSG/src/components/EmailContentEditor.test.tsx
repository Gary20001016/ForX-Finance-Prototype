import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EmailMessageContent } from "../domain/types";
import { createDefaultEmailConfig, createDefaultEmailContent } from "../domain/emailChannel";
import EmailContentEditor from "./EmailContentEditor";

function EditorHarness() {
  const [content, setContent] = useState<EmailMessageContent>(createDefaultEmailContent());
  const [config, setConfig] = useState(createDefaultEmailConfig());
  return (
    <EmailContentEditor
      content={content}
      config={config}
      variables={[]}
      sourceLocale="zh-CN"
      locales={["zh-CN", "en-US"]}
      onContentChange={(changes) => setContent((current) => ({ ...current, ...changes }))}
      onConfigChange={(changes) => setConfig((current) => ({ ...current, ...changes }))}
    />
  );
}

it("uses mutually exclusive plain-text and localized HTML body modes", async () => {
  const user = userEvent.setup();
  render(<EditorHarness />);

  expect(screen.getByRole("radiogroup", { name: "邮件正文类型" })).toBeVisible();
  expect(screen.getByLabelText("邮件纯文本正文")).toBeVisible();
  expect(screen.queryByText("zh-CN HTML")).not.toBeInTheDocument();

  await user.click(screen.getByRole("radio", { name: "HTML 文件" }));

  expect(screen.queryByLabelText("邮件纯文本正文")).not.toBeInTheDocument();
  expect(screen.getByText("zh-CN HTML")).toBeVisible();
  expect(screen.getByText("en-US HTML")).toBeVisible();
  expect(screen.getByText(/每种语言直接上传完成稿/)).toBeVisible();
  expect(screen.getByText(/多语言审核中提供桌面与移动效果预览/)).toBeVisible();
});
