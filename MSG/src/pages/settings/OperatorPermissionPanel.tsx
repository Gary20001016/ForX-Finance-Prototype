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
  fullPagePermissions,
  normalizePagePermissions,
  pagePermissionGroups,
  pagePermissionKeys,
  readOnlyPagePermissions,
  type PagePermissionKey,
  type PagePermissionMap,
} from "../../domain/pagePermissions";
import type { ReviewOperator } from "../../domain/reviewOperators";
import {
  updateOperatorPermissions,
  usePrototypeStore,
} from "../../store/prototypeStore";

const clonePermissions = (permissions: PagePermissionMap) =>
  Object.fromEntries(
    pagePermissionKeys.map((key) => [key, { ...permissions[key] }]),
  ) as PagePermissionMap;

export default function OperatorPermissionPanel() {
  const store = usePrototypeStore();
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<ReviewOperator>();
  const [pagePermissions, setPagePermissions] = useState<PagePermissionMap>(
    readOnlyPagePermissions(),
  );
  const [reviewLocaleCodes, setReviewLocaleCodes] = useState<string[]>([]);

  const operatorLocales = (operatorId: string) =>
    store.languageReviewPolicies
      .filter((policy) => policy.authorizedReviewerIds.includes(operatorId))
      .map((policy) => policy.localeCode);

  useEffect(() => {
    if (!editing) {
      setPagePermissions(readOnlyPagePermissions());
      setReviewLocaleCodes([]);
      return;
    }
    setPagePermissions(
      clonePermissions(
        editing.isSuperAdmin
          ? fullPagePermissions()
          : normalizePagePermissions(editing.pagePermissions),
      ),
    );
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
      title: "页面权限概览",
      width: 240,
      render: (_, operator) => {
        const permissions = operator.isSuperAdmin
          ? fullPagePermissions()
          : normalizePagePermissions(operator.pagePermissions);
        const readable = pagePermissionKeys.filter(
          (key) => permissions[key].read,
        ).length;
        const writable = pagePermissionKeys.filter(
          (key) => permissions[key].write,
        ).length;
        return (
          <Space>
            <Tag color="arcoblue">可读 {readable}</Tag>
            <Tag color="green">可写 {writable}</Tag>
          </Space>
        );
      },
    },
    {
      title: "可审核语言",
      width: 300,
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

  const changePagePermission = (
    key: PagePermissionKey,
    field: "read" | "write",
    checked: boolean,
  ) => {
    setPagePermissions((current) => {
      const next = clonePermissions(current);
      if (field === "write") {
        next[key] = { read: checked || next[key].read, write: checked };
      } else {
        next[key] = {
          read: checked,
          write: checked ? next[key].write : false,
        };
      }
      return next;
    });
  };

  const save = () => {
    if (!editing) return;
    try {
      updateOperatorPermissions(
        editing.id,
        pagePermissions,
        reviewLocaleCodes,
      );
      Message.success("人员权限已更新");
      setEditing(undefined);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "权限更新失败");
    }
  };

  const matrixDisabled = Boolean(!editing?.enabled || editing?.isSuperAdmin);

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
          content="每个页面分别配置读、写权限；语言审核仍按具体语言单独授权，与岗位无关。"
          style={{ marginBottom: 16 }}
        />
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          allowClear
          placeholder="搜索姓名或操作者 ID"
          style={{ width: 320, marginBottom: 16 }}
        />
        <ResourceTable data={data} columns={columns} rowKey="id" />
      </Card>

      <Drawer
        width={760}
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
            {editing.isSuperAdmin && (
              <Alert
                type="info"
                showIcon
                title="超级管理员固定拥有全部页面读写权限"
                content="页面权限不可降级；仍可调整该账号的语言审核授权。"
              />
            )}
            {pagePermissionGroups.map((group) => (
              <section key={group.key}>
                <h3>{group.label}</h3>
                <div className="permission-matrix">
                  <div className="permission-matrix-row permission-matrix-head">
                    <strong>页面 / Tab</strong>
                    <strong>读</strong>
                    <strong>写</strong>
                  </div>
                  {group.resources.map((resource) => (
                    <div className="permission-matrix-row" key={resource.key}>
                      <span>{resource.label}</span>
                      <Checkbox
                        checked={pagePermissions[resource.key].read}
                        disabled={matrixDisabled}
                        onChange={(checked) =>
                          changePagePermission(resource.key, "read", checked)
                        }
                      />
                      <Checkbox
                        checked={pagePermissions[resource.key].write}
                        disabled={matrixDisabled}
                        onChange={(checked) =>
                          changePagePermission(resource.key, "write", checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <section>
              <h3>可审核语言</h3>
              <Select
                mode="multiple"
                showSearch
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
