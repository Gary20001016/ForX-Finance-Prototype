import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateTaskPage from "./CreateTaskPage";

async function openAudienceStep() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <CreateTaskPage />
    </MemoryRouter>,
  );
  await user.type(
    screen.getByPlaceholderText("例如：夏季交易赛召回"),
    "用户分群测试任务",
  );
  await user.click(screen.getByRole("button", { name: "下一步" }));
  await screen.findByRole("heading", { name: "目标用户" });
  return user;
}

it("offers user segments as a manual task audience type", async () => {
  await openAudienceStep();

  expect(screen.getByRole("radio", { name: "用户分群" })).toBeVisible();
});

it("shows the main and excluded segment selectors", async () => {
  const user = await openAudienceStep();

  await user.click(screen.getByRole("radio", { name: "用户分群" }));

  expect(screen.getByText("选择用户分群", { selector: "label" })).toBeVisible();
  expect(screen.getByText("排除分群", { selector: "label" })).toBeVisible();
});

it("requires a main user segment before continuing", async () => {
  const user = await openAudienceStep();

  await user.click(screen.getByRole("radio", { name: "用户分群" }));
  await user.click(screen.getByRole("button", { name: "下一步" }));

  expect(await screen.findByText("请选择用户分群")).toBeVisible();
  expect(screen.getByRole("heading", { name: "目标用户" })).toBeVisible();
});

it("prevents the main segment from being selected as an excluded segment", async () => {
  const user = await openAudienceStep();
  await user.click(screen.getByRole("radio", { name: "用户分群" }));

  const mainSegmentItem = screen
    .getByText("选择用户分群", { selector: "label" })
    .closest(".arco-form-item") as HTMLElement;
  await user.click(mainSegmentItem.querySelector(".arco-select")!);
  fireEvent.click(
    await screen.findByRole("option", {
      name: /近30天沉默交易用户 · 328,400 人/,
    }),
  );

  expect(screen.getByText("328,400")).toBeVisible();

  const excludedSegmentItem = screen
    .getByText("排除分群", { selector: "label" })
    .closest(".arco-form-item") as HTMLElement;
  await user.click(excludedSegmentItem.querySelector(".arco-select")!);
  const listboxes = screen.getAllByRole("listbox");
  const excludedOptions = within(listboxes[listboxes.length - 1]);

  expect(
    excludedOptions.queryByRole("option", { name: /近30天沉默交易用户/ }),
  ).not.toBeInTheDocument();
  expect(
    excludedOptions.getByRole("option", { name: /高风险提现保护名单/ }),
  ).toBeVisible();
});
