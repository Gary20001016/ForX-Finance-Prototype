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

  it("allows maintainers to add, edit and disable a variable", async () => {
    const user = userEvent.setup();
    render(<TemplateVariablePage canManageVariables />);

    await user.click(screen.getByRole("button", { name: "新增变量" }));
    await user.type(screen.getByLabelText("变量名"), "campaign_name");
    await user.type(screen.getByLabelText("变量说明"), "当前活动名称");
    await user.click(screen.getByRole("button", { name: "保存变量" }));

    expect(await screen.findByText(/campaign_name/)).toBeVisible();
    expect(screen.getByText("当前活动名称")).toBeVisible();
  });

  it("previews valid and invalid CSV rows before importing", async () => {
    const user = userEvent.setup();
    render(<TemplateVariablePage canManageVariables />);

    await user.click(screen.getByRole("button", { name: "CSV 导入" }));
    await user.upload(
      screen.getByLabelText("上传变量 CSV"),
      new File(
        [
          "variable_name,description\nuser_nickname,展示昵称\ncampaign_name,活动名称\nBad-Key,错误",
        ],
        "variables.csv",
        { type: "text/csv" },
      ),
    );

    expect(await screen.findByText("variables.csv")).toBeVisible();
    expect(screen.getByText("新增 1")).toBeVisible();
    expect(screen.getByText("更新 1")).toBeVisible();
    expect(screen.getByText("错误 1")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "确认导入 2 条有效变量" }),
    ).toBeEnabled();
  });
});
