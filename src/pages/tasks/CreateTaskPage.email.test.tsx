import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateTaskPage from "./CreateTaskPage";

it("authors Email content for a temporary message", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <CreateTaskPage />
    </MemoryRouter>,
  );

  const emailChannel = screen.getByRole("checkbox", { name: "Email" });
  expect(emailChannel).toBeVisible();
  await user.click(emailChannel);
  await user.click(screen.getByRole("radio", { name: "临时消息" }));

  expect(screen.getByLabelText("邮件标题")).toBeVisible();
  expect(screen.getByLabelText("邮件纯文本正文")).toBeVisible();
  expect(screen.getByLabelText("邮件类型")).toHaveTextContent("事务邮件");
});
