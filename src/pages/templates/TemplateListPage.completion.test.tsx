import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TemplateListPage from "./TemplateListPage";

it("opens a complete template content editor", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <TemplateListPage />
    </MemoryRouter>,
  );
  await user.click(
    screen.getByRole("button", { name: "新建人工消息模板" }),
  );
  expect(
    screen.queryByText("模板编码", { selector: "label" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText(/snake_case/)).not.toBeInTheDocument();
  expect(screen.getByLabelText("站内信标题")).toBeVisible();
  expect(screen.getByLabelText("Push Deep Link")).toBeVisible();
  expect(screen.getByText("提交外部机翻")).toBeVisible();
});

it("shows the system template number instead of the internal code", () => {
  render(
    <MemoryRouter initialEntries={["/templates?scope=manual"]}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("TPL-1004")).toBeVisible();
  expect(screen.queryByText("network_maintenance")).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("搜索模板编号或名称")).toBeVisible();
});

it("shows task usage instead of a direct event binding", () => {
  render(
    <MemoryRouter>
      <TemplateListPage />
    </MemoryRouter>,
  );
  expect(screen.getByText("使用任务")).toBeVisible();
  expect(screen.queryByText("事件编码")).not.toBeInTheDocument();
  expect(screen.getAllByText(/人工 \d+ · 事件 \d+/).length).toBeGreaterThan(0);
});
