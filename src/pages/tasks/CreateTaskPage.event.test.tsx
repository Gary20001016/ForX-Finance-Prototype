import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateTaskPage from "./CreateTaskPage";

it("configures an event-triggered task with event policy fields", () => {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/tasks/create",
          state: { eventId: "liquidation.warning" },
        },
      ]}
    >
      <CreateTaskPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("系统事件触发配置")).toBeVisible();
  expect(screen.getByText(/合约强平预警/)).toBeVisible();
  expect(screen.getByLabelText("触发条件")).toBeVisible();
  expect(screen.getByLabelText("去重键")).toBeVisible();
  expect(screen.getByText("变量映射")).toBeVisible();
});
