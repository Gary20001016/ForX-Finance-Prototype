import { useMemo, useState } from "react";
import {
  Button,
  Empty,
  Input,
  Message,
  Popover,
  Space,
} from "@arco-design/web-react";
import { IconCopy, IconPlus } from "@arco-design/web-react/icon";
import { variableToken } from "../domain/manualMessageVariables";
import type { ControlledTemplateVariable } from "../domain/types";

export default function VariablePicker({
  variables,
  onInsert,
}: {
  variables: ControlledTemplateVariable[];
  onInsert: (name: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [visible, setVisible] = useState(false);
  const available = useMemo(
    () =>
      variables.filter(
        (item) =>
          item.status === "启用" &&
          `${item.name}${item.description}`
            .toLowerCase()
            .includes(keyword.toLowerCase()),
      ),
    [keyword, variables],
  );

  const copy = async (name: string) => {
    try {
      await navigator.clipboard?.writeText(variableToken(name));
      Message.success("变量已复制");
    } catch {
      Message.error("复制失败，请重试");
    }
  };

  return (
    <Popover
      trigger="click"
      style={{ maxWidth: 460 }}
      popupVisible={visible}
      onVisibleChange={setVisible}
      position="br"
      content={
        <div className="variable-picker-panel">
          <Input.Search
            aria-label="搜索模板变量"
            value={keyword}
            onChange={setKeyword}
            allowClear
            placeholder="搜索变量名或说明"
          />
          <div className="variable-picker-list">
            {available.length ? (
              available.map((item) => (
                <div className="variable-picker-row" key={item.id}>
                  <div>
                    <code>{variableToken(item.name)}</code>
                    <span>{item.description}</span>
                  </div>
                  <Space size={4}>
                    <Button
                      size="mini"
                      type="text"
                      icon={<IconCopy />}
                      aria-label={`复制 ${item.name}`}
                      onClick={() => void copy(item.name)}
                    />
                    <Button
                      size="mini"
                      type="primary"
                      aria-label={`插入 ${item.name}`}
                      onClick={() => {
                        onInsert(item.name);
                        setVisible(false);
                        setKeyword("");
                      }}
                    >
                      插入正文
                    </Button>
                  </Space>
                </div>
              ))
            ) : (
              <Empty description="没有匹配的启用变量" />
            )}
          </div>
        </div>
      }
    >
      <Button
        size="mini"
        type="text"
        icon={<IconPlus />}
        onMouseDown={(event) => event.preventDefault()}
      >
        插入变量
      </Button>
    </Popover>
  );
}
