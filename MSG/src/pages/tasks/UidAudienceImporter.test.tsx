import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import UidAudienceImporter, {
  createEmptyUidAudienceValue,
  type UidAudienceValue,
} from "./UidAudienceImporter";

function Harness({ initial }: { initial?: UidAudienceValue }) {
  const [value, setValue] = useState(
    initial || createEmptyUidAudienceValue(),
  );
  return <UidAudienceImporter value={value} onChange={setValue} />;
}

describe("UidAudienceImporter", () => {
  it("describes the empty CSV state as manual-only", () => {
    render(<Harness />);

    expect(screen.getByLabelText("最终目标用户")).toHaveTextContent(
      "仅手动 UID，已去重",
    );
    expect(screen.getByLabelText("最终目标用户")).not.toHaveTextContent(
      "未确认 CSV",
    );
  });

  it("merges manual UIDs with confirmed valid CSV rows", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("手动输入 UID"), "100001\n100002");
    const file = new File(
      ["uid,remark\n100002,duplicate\n100003,valid\nbad uid,invalid"],
      "audience.csv",
      { type: "text/csv" },
    );
    await user.upload(screen.getByLabelText("上传 UID CSV"), file);

    expect(await screen.findByText("待确认")).toBeVisible();
    expect(screen.getByText("1 条无效 UID 将被排除")).toBeVisible();
    expect(screen.getByLabelText("最终目标用户")).toHaveTextContent("2");

    await user.click(
      screen.getByRole("button", { name: "确认排除无效 UID" }),
    );

    expect(screen.getByText("已确认")).toBeVisible();
    expect(screen.getByLabelText("最终目标用户")).toHaveTextContent("3");
    expect(screen.getByText("ba***id")).toBeVisible();
    expect(screen.queryByText("bad uid")).not.toBeInTheDocument();
  });

  it("keeps manual input when the CSV is deleted", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("手动输入 UID"), "100001");
    await user.upload(
      screen.getByLabelText("上传 UID CSV"),
      new File(["uid\n100002"], "a.csv", { type: "text/csv" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "确认导入有效 UID" }),
    );
    await user.click(screen.getByRole("button", { name: "删除 CSV" }));

    expect(screen.getByLabelText("手动输入 UID")).toHaveValue("100001");
    expect(screen.getByLabelText("最终目标用户")).toHaveTextContent("1");
    expect(screen.queryByText("a.csv")).not.toBeInTheDocument();
  });

  it("shows a parse error without replacing the previous confirmed file", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.upload(
      screen.getByLabelText("上传 UID CSV"),
      new File(["uid\n100002"], "good.csv", { type: "text/csv" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "确认导入有效 UID" }),
    );
    await user.upload(
      screen.getByLabelText("上传 UID CSV"),
      new File(["user_id\n100003"], "bad.csv", { type: "text/csv" }),
    );

    expect(await screen.findByText("CSV 必须包含 uid 列")).toBeVisible();
    expect(screen.getByText("good.csv")).toBeVisible();
    expect(screen.getByText("已确认")).toBeVisible();
  });

  it("exposes template and error-detail download actions", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(
      screen.getByRole("button", { name: "下载 CSV 模板" }),
    ).toBeVisible();
    await user.upload(
      screen.getByLabelText("上传 UID CSV"),
      new File(["uid\nbad uid"], "invalid.csv", { type: "text/csv" }),
    );
    expect(
      await screen.findByRole("button", { name: "下载错误明细" }),
    ).toBeEnabled();
  });
});
