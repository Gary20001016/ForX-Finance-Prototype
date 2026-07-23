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
    screen.getByText("统一处理人工任务、消息模板和事件通知规则审核。"),
  ).toBeInTheDocument();
});
