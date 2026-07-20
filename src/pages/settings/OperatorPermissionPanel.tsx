import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Drawer,
  Input,
  Message,
  Select,
  Space,
  Tag,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import ResourceTable from "../../components/ResourceTable";
import {
  operatorPermissionLabels,
  type OperatorPermission,
  type ReviewOperator,
} from "../../domain/reviewOperators";
import {
  updateOperatorPermissions,
  usePrototypeStore,
} from "../../store/prototypeStore";

const permissionOptions = Object.entries(operatorPermissionLabels).map(
  ([value, label]) => ({ value, label }),
);

export default function OperatorPermissionPanel() {
  const store = usePrototypeStore();
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<ReviewOperator>();
  const [permissions, setPermissions] = useState<OperatorPermission[]>([]);
  const [reviewLocaleCodes, setReviewLocaleCodes] = useState<string[]>([]);

  const operatorLocales = (operatorId: string) =>
    store.languageReviewPolicies
      .filter((policy) => policy.authorizedReviewerIds.includes(operatorId))
      .map((policy) => policy.localeCode);

  useEffect(() => {
    if (!editing) {
      setPermissions([]);
      setReviewLocaleCodes([]);
      return;
    }
    setPermissions([...editing.permissions]);
    setReviewLocaleCodes(operatorLocales(editing.id));
  }, [editing?.id]);

  const data = useMemo(
    () =>
      store.operators.filter((operator) =>
        `${operator.name}${operator.id}`
          .toLowerCase()
          .includes(keyword.trim().toLowerCase()),
      ),
    [keyword, store.operators],
  );

  const columns: TableColumnProps<ReviewOperator>[] = [
    {
      title: "操作者",
      width: 220,
      render: (_, operator) => (
        <div>
          <Space>
            <strong>{operator.name}</strong>
            {operator.isSuperAdmin && <Tag color="purple">超级管理员</Tag>}
          </Space>
          <div className="mono muted">{operator.id}</div>
        </div>
      ),
    },
    {
      title: "账号状态",
      width: 110,
      render: (_, operator) => (
        <Tag color={operator.enabled ? "green" : "gray"}>
          {operator.enabled ? "启用" : "停用"}
        </Tag>
      ),
    },
    {
      title: "已授权能力",
      width: 360,
      render: (_, operator) =>
        operator.permissions.length ? (
          <Space wrap>
            {operator.permissions.map((permission) => (
              <Tag key={permission} color="arcoblue">
                {operatorPermissionLabels[permission]}
              </Tag>
            ))}
          </Space>
        ) : (
          <span className="muted">未授权功能权限</span>
        ),
    },
    {
      title: "可审核语言",
      width: 260,
      render: (_, operator) => {
        const locales = store.languageReviewPolicies.filter((policy) =>
          policy.authorizedReviewerIds.includes(operator.id),
        );
        return locales.length ? (
          <Space wrap>
            {locales.map((policy) => (
              <Tag key={policy.localeCode}>
                {policy.localeName} · {policy.localeCode}
              </Tag>
            ))}
          </Space>
        ) : (
          <span className="muted">未分配</span>
        );
      },
    },
    {
      title: "操作",
      fixed: "right",
      width: 120,
      render: (_, operator) => (
        <Button type="text" onClick={() => setEditing(operator)}>
          编辑权限
        </Button>
      ),
    },
  ];

  const save = () => {
    if (!editing) return;
    try {
      updateOperatorPermissions(editing.id, permissions, reviewLocaleCodes);
      Message.success("人员权限已更新");
      setEditing(undefined);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "权限更新失败");
    }
  };

  return (
    <>
      <Card
        bordered={false}
        className="surface"
        title="人员权限"
        extra={<Tag color="purple">仅超级管理员</Tag>}
      >
        <Alert
          type="info"
          showIcon
          title="权限按人员独立配置"
          content="权限与岗位无关；可审核语言与“语言审核策略”使用同一份授权数据。"
          style={{ marginBottom: 16 }}
        />
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          allowClear
          placeholder="搜索姓名或操作者 ID"
          style={{ width: 320, marginBottom: 16 }}
        />
        <ResourceTable
          data={data}
          columns={columns}
          rowKey="id"
        />
      </Card>

      <Drawer
        width={680}
        visible={Boolean(editing)}
        title={editing ? `编辑权限 · ${editing.name}` : "编辑人员权限"}
        onCancel={() => setEditing(undefined)}
        footer={
          <div className="drawer-footer">
            <Button onClick={() => setEditing(undefined)}>取消</Button>
            <Button
              type="primary"
              disabled={!editing?.enabled}
              onClick={save}
            >
              保存权限
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="page-stack compact">
            <Descriptions
              border
              column={2}
              data={[
                { label: "姓名", value: editing.name },
                { label: "操作者 ID", value: editing.id },
                {
                  label: "账号状态",
                  value: editing.enabled ? "启用" : "停用",
                },
                {
                  label: "系统身份",
                  value: editing.isSuperAdmin ? "超级管理员" : "普通操作者",
                },
              ]}
            />
            {!editing.enabled && (
              <Alert
                type="warning"
                showIcon
                title="账号已停用"
                content="停用账号的权限仅供查看，请先在账号系统中启用后再修改。"
              />
            )}
            <section>
              <h3>功能权限</h3>
              <Checkbox.Group
                value={permissions}
                disabled={!editing.enabled}
                options={permissionOptions}
                onChange={(values) =>
                  setPermissions(values as OperatorPermission[])
                }
              />
            </section>
            <section>
              <h3>可审核语言</h3>
              <Select
                mode="multiple"
                allowSearch
                value={reviewLocaleCodes}
                disabled={!editing.enabled}
                placeholder="选择该人员可审核的语言"
                style={{ width: "100%" }}
                options={store.languageReviewPolicies
                  .filter((policy) => policy.enabled)
                  .map((policy) => ({
                    value: policy.localeCode,
                    label: `${policy.localeName} · ${policy.localeCode}`,
                  }))}
                onChange={(values) =>
                  setReviewLocaleCodes(values as string[])
                }
              />
              <p className="muted">
                修改后会同步更新“语言审核策略”中的授权审核人。
              </p>
            </section>
          </div>
        )}
      </Drawer>
    </>
  );
}
