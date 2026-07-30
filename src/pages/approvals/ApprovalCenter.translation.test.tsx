import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import ApprovalCenterPage from "./ApprovalCenterPage";

it("keeps business and risk approval separate from language review", () => {
  render(
    <MemoryRouter>
      <ApprovalCenterPage />
    </MemoryRouter>,
  );

  expect(screen.queryByRole("tab", { name: /翻译审核/ })).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "统一处理内容审核、任务配置审核和事件通知规则审核；新内容审核通过后才进入多语言。",
    ),
  ).toBeInTheDocument();
});
