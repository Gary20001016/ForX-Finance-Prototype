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
    screen.getByText("统一处理消息任务和模板发布的业务与风控审批。"),
  ).toBeInTheDocument();
});
