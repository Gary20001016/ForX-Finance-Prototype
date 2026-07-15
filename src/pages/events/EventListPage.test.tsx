import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import { resetPrototypeStore } from "../../store/prototypeStore";
import EventListPage from "./EventListPage";

beforeEach(() => resetPrototypeStore());

it("keeps event definitions separate from notification rules", () => {
  render(
    <MemoryRouter>
      <EventListPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "事件目录" })).toBeVisible();
  expect(screen.getByText("关联通知规则")).toBeVisible();
  expect(screen.queryByText("关联触发任务")).not.toBeInTheDocument();
});
