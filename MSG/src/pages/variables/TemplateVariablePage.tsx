import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Input,
  Message,
  Select,
  Space,
  Tag,
} from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import FilterBar from "../../components/FilterBar";
import PageHeader from "../../components/PageHeader";
import ResourceTable from "../../components/ResourceTable";
import StatusTag from "../../components/StatusTag";
import { variableToken } from "../../domain/manualMessageVariables";
import type { ControlledTemplateVariable } from "../../domain/types";
import { usePrototypeStore } from "../../store/prototypeStore";

export default function TemplateVariablePage({
  canManageVariables: _canManageVariables = true,
}: {
  canManageVariables?: boolean;
}) {
  const store = usePrototypeStore();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();

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
    {
      title: "来源",
      width: 120,
      render: () => <Tag>后台同步</Tag>,
    },
    {
      title: "操作",
      width: 120,
      render: (_, row) => (
          <Button
            type="text"
            disabled={row.status !== "启用"}
            onClick={() => void copyVariable(row.name)}
          >
            复制变量
          </Button>
      ),
    },
  ];

  return (
    <section className="page-stack template-variable-page">
      <PageHeader
        title="模板变量"
        description="由后台消息平台统一维护；操作者可以查询并复制已启用变量到人工消息正文。"
        tags={
          <Space>
            <Tag color="arcoblue">仅人工消息使用</Tag>
            <Tag color="green">后台同步 · 只读</Tag>
          </Space>
        }
      />
      <Alert
        type="info"
        showIcon
        content="变量名称、说明和启停状态由后台统一管理，本页面不提供新增、导入、编辑或启停操作。"
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
    </section>
  );
}
