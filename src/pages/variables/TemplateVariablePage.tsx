import { useMemo, useState } from "react";
import {
  Button,
  Form,
  Grid,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import { IconDownload, IconPlus } from "@arco-design/web-react/icon";
import FilterBar from "../../components/FilterBar";
import PageHeader from "../../components/PageHeader";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import { variableToken } from "../../domain/manualMessageVariables";
import type { ControlledTemplateVariable } from "../../domain/types";
import {
  addControlledVariable,
  updateControlledVariable,
  usePrototypeStore,
} from "../../store/prototypeStore";
import VariableCsvImportModal from "./VariableCsvImportModal";

export default function TemplateVariablePage({
  canManageVariables = true,
}: {
  canManageVariables?: boolean;
}) {
  const store = usePrototypeStore();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [editing, setEditing] = useState<ControlledTemplateVariable | "new">();
  const [importVisible, setImportVisible] = useState(false);
  const [form] = Form.useForm();

  const data = useMemo(
    () =>
      store.templateVariables.filter(
        (item) =>
          `${item.name}${item.description}`
            .toLowerCase()
            .includes(keyword.toLowerCase()) && (!status || item.status === status),
      ),
    [keyword, status, store.templateVariables],
  );

  const copyVariable = async (name: string) => {
    try {
      await navigator.clipboard?.writeText(variableToken(name));
      Message.success("变量已复制");
    } catch {
      Message.error("复制失败，请重试");
    }
  };

  const openEditor = (variable: ControlledTemplateVariable | "new") => {
    setEditing(variable);
    form.setFieldsValue(
      variable === "new"
        ? { name: "", description: "", enabled: true }
        : {
            name: variable.name,
            description: variable.description,
            enabled: variable.status === "启用",
          },
    );
  };

  const save = async () => {
    try {
      const values = await form.validate();
      if (editing === "new") {
        addControlledVariable({
          name: values.name,
          description: values.description,
          updatedBy: "Gary Ma",
        });
        Message.success("变量已新增");
      } else if (editing) {
        updateControlledVariable(editing.id, {
          description: values.description,
          status: values.enabled ? "启用" : "停用",
          updatedBy: "Gary Ma",
        });
        Message.success("变量已更新");
      }
      setEditing(undefined);
    } catch (reason) {
      if (reason instanceof Error) Message.error(reason.message);
    }
  };

  const columns: TableColumnProps<ControlledTemplateVariable>[] = [
    {
      title: "变量名",
      dataIndex: "name",
      width: 210,
      render: (name) => <code>{variableToken(name)}</code>,
    },
    { title: "变量说明", dataIndex: "description" },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value) => <StatusTag status={value} />,
    },
    { title: "更新时间", dataIndex: "updatedAt", width: 170 },
    { title: "更新人", dataIndex: "updatedBy", width: 120 },
    {
      title: "操作",
      width: canManageVariables ? 260 : 110,
      render: (_, row) => (
        <Space>
          <Button type="text" onClick={() => void copyVariable(row.name)}>
            复制变量
          </Button>
          {canManageVariables && (
            <>
              <Button type="text" onClick={() => openEditor(row)}>
                编辑
              </Button>
              <Button
                type="text"
                status={row.status === "启用" ? "danger" : "success"}
                onClick={() =>
                  updateControlledVariable(row.id, {
                    description: row.description,
                    status: row.status === "启用" ? "停用" : "启用",
                    updatedBy: "Gary Ma",
                  })
                }
              >
                {row.status === "启用" ? "停用" : "启用"}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <section className="page-stack template-variable-page">
      <PageHeader
        title="模板变量"
        description="维护人工消息可搜索、可复制、可插入正文的受控变量。"
        actions={
          canManageVariables ? (
            <>
              <Button
                icon={<IconDownload />}
                onClick={() => setImportVisible(true)}
              >
                CSV 导入
              </Button>
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={() => openEditor("new")}
              >
                新增变量
              </Button>
            </>
          ) : undefined
        }
        tags={<Tag color="arcoblue">仅人工消息使用</Tag>}
      />
      <FilterBar onReset={() => { setKeyword(""); setStatus(undefined); }}>
        <Input.Search
          value={keyword}
          onChange={setKeyword}
          allowClear
          placeholder="搜索变量名或说明"
          style={{ width: 300 }}
        />
        <Select
          value={status}
          onChange={setStatus}
          allowClear
          placeholder="状态"
          style={{ width: 140 }}
          options={["启用", "停用"].map((value) => ({ label: value, value }))}
        />
      </FilterBar>
      <ResourceTable data={data} columns={columns} rowKey="id" />
      <Modal
        title={editing === "new" ? "新增变量" : "编辑变量"}
        visible={Boolean(editing)}
        onCancel={() => setEditing(undefined)}
        onOk={save}
        okText="保存变量"
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="变量名"
            field="name"
            required
            rules={[{ required: true }]}
            extra="使用 snake_case；创建后不可修改"
          >
            <Input
              aria-label="变量名"
              disabled={editing !== "new"}
              placeholder="例如 campaign_name"
            />
          </Form.Item>
          <Form.Item
            label="变量说明"
            field="description"
            required
            rules={[{ required: true }]}
          >
            <Input.TextArea aria-label="变量说明" />
          </Form.Item>
          {editing !== "new" && (
            <Grid.Row>
              <Form.Item
                label="启用状态"
                field="enabled"
                triggerPropName="checked"
              >
                <Switch />
              </Form.Item>
            </Grid.Row>
          )}
        </Form>
      </Modal>
      <VariableCsvImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
      />
    </section>
  );
}
