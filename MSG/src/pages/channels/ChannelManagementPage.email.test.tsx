import { fireEvent, render, screen } from "@testing-library/react";
import ChannelManagementPage from "./ChannelManagementPage";

it("shows Email domain, stream and authentication configuration", () => {
  render(<ChannelManagementPage />);

  expect(screen.getByText("SendGrid Primary")).toBeVisible();
  const buttons = screen.getAllByRole("button", { name: "配置" });
  fireEvent.click(buttons[2]);

  expect(screen.getByText("事务发送流")).toBeVisible();
  expect(screen.getByText("营销发送流")).toBeVisible();
  expect(screen.getByText("SPF 已通过")).toBeVisible();
  expect(screen.getByText("DKIM 已通过")).toBeVisible();
  expect(screen.getByText("DMARC 已通过")).toBeVisible();
});
