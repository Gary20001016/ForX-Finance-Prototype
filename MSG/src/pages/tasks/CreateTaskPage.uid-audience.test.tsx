import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateTaskPage from "./CreateTaskPage";

async function openSpecifiedUidStep() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <CreateTaskPage />
    </MemoryRouter>,
  );
  await user.type(
    screen.getByPlaceholderText("例如：夏季交易赛召回"),
    "指定 UID 通知",
  );
  await user.click(screen.getByRole("button", { name: "下一步" }));
  await user.click(screen.getByRole("radio", { name: "指定用户" }));
  return user;
}

it("uses confirmed manual and CSV UIDs as the specified audience", async () => {
  const user = await openSpecifiedUidStep();

  await user.clear(screen.getByLabelText("手动输入 UID"));
  await user.type(screen.getByLabelText("手动输入 UID"), "100001\n100002");
  await user.upload(
    screen.getByLabelText("上传 UID CSV"),
    new File(["uid\n100002\n100003"], "users.csv", { type: "text/csv" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "确认导入有效 UID" }),
  );

  expect(screen.getByLabelText("最终目标用户")).toHaveTextContent("3");
  expect(screen.getByText("UID 10***01")).toBeVisible();
  expect(screen.getByText("UID 10***02")).toBeVisible();
  expect(screen.getByText("UID 10***03")).toBeVisible();
});

it("blocks the next step while a parsed CSV is not confirmed", async () => {
  const user = await openSpecifiedUidStep();

  await user.upload(
    screen.getByLabelText("上传 UID CSV"),
    new File(["uid\n100004"], "pending.csv", { type: "text/csv" }),
  );
  expect(await screen.findByText("待确认")).toBeVisible();

  await user.click(screen.getByRole("button", { name: "下一步" }));

  expect(await screen.findByText("请先确认 UID CSV 导入结果")).toBeVisible();
  expect(screen.getByRole("heading", { name: "目标用户" })).toBeVisible();
});

it("keeps system event automation out of the artificial task creator", () => {
  render(
    <MemoryRouter>
      <CreateTaskPage />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole("radio", { name: "系统事件触发" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(/系统事件自动通知请前往“事件通知规则”配置/),
  ).toBeVisible();
});
