import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplateVariablePage from "./TemplateVariablePage";

describe("TemplateVariablePage", () => {
  it("lets manual-message operators search and copy controlled variables", async () => {
    const user = userEvent.setup();
    render(<TemplateVariablePage canManageVariables={false} />);

    expect(
      screen.getByRole("heading", { name: "模板变量" }),
    ).toBeVisible();
    expect(screen.getByText(/由后台消息平台统一维护/)).toBeVisible();
    expect(screen.getByText(/user_nickname/)).toBeVisible();
    expect(screen.getAllByRole("button", { name: "复制变量" }).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "新增变量" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "CSV 导入" }),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("搜索变量名或说明"),
      "客服邮箱",
    );
    expect(screen.getByText(/support_email/)).toBeVisible();
    expect(screen.queryByText(/user_nickname/)).not.toBeInTheDocument();
  });

  it("keeps the variable catalog read-only even for operators with write access", () => {
    render(<TemplateVariablePage canManageVariables />);

    expect(
      screen.queryByRole("button", { name: "新增变量" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "CSV 导入" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "编辑" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "停用" })).not.toBeInTheDocument();
  });
});
