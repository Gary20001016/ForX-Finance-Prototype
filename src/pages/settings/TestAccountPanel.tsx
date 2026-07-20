import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Message,
  Modal,
  Space,
  Tag,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import type { OperatorTestAccount } from "../../domain/types";
import {
  addOperatorTestAccount,
  removeOperatorTestAccount,
  updateOperatorTestAccount,
  usePrototypeStore,
} from "../../store/prototypeStore";

const CURRENT_OPERATOR_ID = "admin-01";

export default function TestAccountPanel() {
  const store = usePrototypeStore();
  const accounts = store.testAccounts.filter(
    (account) => account.operatorId === CURRENT_OPERATOR_ID,
  );
  const [editing, setEditing] = useState<OperatorTestAccount | "new">();
  const [uid, setUid] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    setUid(editing && editing !== "new" ? editing.uid : "");
    setRemark(editing && editing !== "new" ? editing.remark : "");
  }, [editing]);

  const save = () => {
    try {
      if (editing && editing !== "new") {
        updateOperatorTestAccount(editing.id, CURRENT_OPERATOR_ID, { remark });
        Message.success("测试账号备注已更新");
      } else {
        addOperatorTestAccount({
          operatorId: CURRENT_OPERATOR_ID,
          uid,
          remark,
        });
        Message.success("测试账号已新增");
      }
      setEditing(undefined);
    } catch (error) {
      if (error instanceof Error) Message.error(error.message);
    }
  };

  return (
    <>
      <Card
        bordered={false}
        className="surface"
        title="我的测试账号"
        extra={
          <Space>
            <Tag color={accounts.length >= 4 ? "orange" : "arcoblue"}>
              {accounts.length} / 4
            </Tag>
            <Button
              type="primary"
              icon={<IconPlus />}
              disabled={accounts.length >= 4}
              onClick={() => setEditing("new")}
            >
              新增测试账号
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          title="仅用于个人测试发送"
          content="模板测试发送会自动使用你配置的全部测试账号。每人最多 4 个，其他操作者无法查看或使用。"
          style={{ marginBottom: 16 }}
        />
        <div className="settings-list">
          {accounts.map((account) => (
            <div key={account.id}>
              <div>
                <strong className="mono">{account.uid}</strong>
                <div className="muted">{account.remark}</div>
              </div>
              <span>创建于 {account.createdAt}</span>
              <span>更新于 {account.updatedAt}</span>
              <Space>
                <Button type="text" onClick={() => setEditing(account)}>
                  编辑备注
                </Button>
                <Button
                  type="text"
                  status="danger"
                  onClick={() => {
                    removeOperatorTestAccount(account.id, CURRENT_OPERATOR_ID);
                    Message.success("测试账号已删除");
                  }}
                >
                  删除
                </Button>
              </Space>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        visible={Boolean(editing)}
        title={editing === "new" ? "新增测试账号" : "编辑测试账号备注"}
        onCancel={() => setEditing(undefined)}
        footer={
          <Space>
            <Button onClick={() => setEditing(undefined)}>取消</Button>
            <Button type="primary" onClick={save}>
              保存测试账号
            </Button>
          </Space>
        }
        unmountOnExit
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <label>
            用户 UID
            <Input
              value={uid}
              disabled={editing !== "new"}
              onChange={setUid}
              placeholder="输入用户 UID"
            />
          </label>
          <label>
            账号备注
            <Input
              value={remark}
              onChange={setRemark}
              placeholder="例如：备用 iPhone"
            />
          </label>
        </Space>
      </Modal>
    </>
  );
}
