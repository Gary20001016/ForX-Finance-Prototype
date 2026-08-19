import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatusTag from "../../components/StatusTag";
import WritePermissionButton from "../../components/WritePermissionButton";
import {
  canReadPage,
  canWritePage,
  type PagePermissionKey,
} from "../../domain/pagePermissions";
import { CURRENT_REVIEW_OPERATOR_ID } from "../../domain/reviewOperators";
import type {
  LinkAllowlistEntry,
  MessageCategory,
  MessageTopic,
  RiskLevel,
} from "../../domain/types";
import { MESSAGE_RISK_LEVELS } from "../../domain/messageDisplayTaxonomy";
import {
  addAllowlistEntry,
  updateAllowlistEntry,
  updateMessageCategory,
  usePrototypeStore,
} from "../../store/prototypeStore";
import LanguageReviewPolicyPanel from "./LanguageReviewPolicyPanel";
import OperatorPermissionPanel from "./OperatorPermissionPanel";
import TestAccountPanel from "./TestAccountPanel";
import ChannelManagementPage from "../channels/ChannelManagementPage";

type CategoryConfig = {
  code: MessageCategory["code"];
  name: string;
  risk: RiskLevel;
  retention: number;
  order: number;
  topics: MessageTopic[];
  status: boolean;
};

const settingsTabs: Array<{
  key: string;
  label: string;
  permissionKey: PagePermissionKey;
}> = [
  { key: "channels", label: "渠道配置", permissionKey: "settings.channels" },
  { key: "categories", label: "前台展示分类", permissionKey: "settings.categories" },
  { key: "links", label: "跳转白名单", permissionKey: "settings.links" },
  {
    key: "language-review",
    label: "语言审核策略",
    permissionKey: "settings.languageReview",
  },
  {
    key: "test-accounts",
    label: "测试账号",
    permissionKey: "settings.testAccounts",
  },
  { key: "audit", label: "审计日志", permissionKey: "settings.audit" },
];

function AllowlistEditor({
  entry,
  visible,
  canWrite,
  onClose,
}: {
  entry?: LinkAllowlistEntry;
  visible: boolean;
  canWrite: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const save = async () => {
    if (!canWrite) {
      Message.warning("当前账号无写权限");
      return;
    }
    try {
      const values = await form.validate();
      const payload = {
        name: values.name,
        type: values.type,
        pattern: values.pattern,
        platforms: values.platforms,
        parameterRule: values.parameterRule,
        effectiveAt: String(values.effectiveAt || "立即"),
        expiresAt: String(values.expiresAt || "长期"),
        status: values.status ? "启用" : "停用",
        owner: values.owner,
      } as Omit<LinkAllowlistEntry, "id">;
      if (entry) updateAllowlistEntry(entry.id, payload);
      else addAllowlistEntry(payload);
      Message.success(entry ? "白名单已更新" : "白名单已新增");
      onClose();
    } catch {
      // Form validation keeps the editor open.
    }
  };
  return (
    <Modal
      title={entry ? `编辑白名单 · ${entry.name}` : "新增跳转白名单"}
      visible={visible}
      onCancel={onClose}
      onOk={save}
      okText="保存并生效"
      okButtonProps={{ disabled: !canWrite }}
      style={{ width: 760 }}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: entry?.name,
          type: entry?.type || "Deep Link",
          pattern: entry?.pattern,
          platforms: entry?.platforms || ["iOS", "Android"],
          parameterRule: entry?.parameterRule,
          owner: entry?.owner || "消息运营",
          status: entry?.status !== "停用",
        }}
      >
        <Grid.Row gutter={16}>
          <Grid.Col span={12}>
            <Form.Item label="规则名称" field="name" required rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={12}>
            <Form.Item label="链接类型" field="type">
              <Select options={["Deep Link", "Web URL"].map((value) => ({ label: value, value }))} />
            </Form.Item>
          </Grid.Col>
        </Grid.Row>
        <Form.Item label="路径或域名规则" field="pattern" required rules={[{ required: true }]}>
          <Input placeholder="forxfinance://security/devices 或 https://.../*" />
        </Form.Item>
        <Form.Item label="允许平台" field="platforms">
          <Select mode="multiple" options={["Web", "iOS", "Android"].map((value) => ({ label: value, value }))} />
        </Form.Item>
        <Form.Item label="参数规则" field="parameterRule" required>
          <Input.TextArea placeholder="说明参数名称、类型、长度及是否允许透传" />
        </Form.Item>
        <Grid.Row gutter={16}>
          <Grid.Col span={8}>
            <Form.Item label="生效时间" field="effectiveAt">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={8}>
            <Form.Item label="失效时间" field="expiresAt">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={8}>
            <Form.Item label="所有者" field="owner">
              <Select options={["消息运营", "安全中心", "资金平台", "内容运营"].map((value) => ({ label: value, value }))} />
            </Form.Item>
          </Grid.Col>
        </Grid.Row>
        <Form.Item label="启用状态" field="status" triggerPropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function SettingsPage() {
  const store = usePrototypeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const currentOperator = store.operators.find(
    (operator) => operator.id === CURRENT_REVIEW_OPERATOR_ID,
  );
  const isSuperAdmin = Boolean(currentOperator?.isSuperAdmin);
  const readableTabs = settingsTabs.filter((tab) =>
    canReadPage(currentOperator, tab.permissionKey),
  );
  const visibleTabKeys = [
    ...readableTabs.map((tab) => tab.key),
    ...(isSuperAdmin ? ["operator-permissions"] : []),
  ];
  const requestedTab = new URLSearchParams(location.search).get("tab");
  const activeTab =
    requestedTab && visibleTabKeys.includes(requestedTab)
      ? requestedTab
      : visibleTabKeys[0];
  const canWrite = (key: PagePermissionKey) =>
    canWritePage(currentOperator, key);

  const categories: CategoryConfig[] = store.categories.map((category) => ({
    code: category.code,
    name: category.name,
    risk: category.defaultRisk,
    retention: category.defaultRetentionDays,
    order: category.order,
    topics: category.topics,
    status: category.enabled,
  }));
  const [editingCategory, setEditingCategory] = useState<CategoryConfig>();
  const [managingTopics, setManagingTopics] = useState<CategoryConfig>();
  const [editingLink, setEditingLink] = useState<LinkAllowlistEntry | "new">();
  const [keyword, setKeyword] = useState("");
  const links = store.allowlist.filter((entry) =>
    `${entry.name}${entry.pattern}`
      .toLowerCase()
      .includes(keyword.toLowerCase()),
  );

  const saveCategory = (values: CategoryConfig) => {
    if (!editingCategory || !canWrite("settings.categories")) return;
    updateMessageCategory(editingCategory.code, {
      defaultRisk: values.risk,
      defaultRetentionDays: values.retention,
      order: values.order,
      enabled: values.status,
    });
    setEditingCategory(undefined);
    Message.success("前台展示分类配置已更新");
  };

  const saveTopics = () => {
    if (!managingTopics || !canWrite("settings.categories")) return;
    updateMessageCategory(managingTopics.code, {
      topics: managingTopics.topics,
    });
    setManagingTopics(undefined);
    Message.success("二级主题配置已更新");
  };

  return (
    <section className="page-stack">
      <PageHeader
        title="系统配置"
        description="维护渠道供应商、前台展示分类、个人测试账号、跳转白名单、语言审核策略、人员权限和审计日志。"
      />
      <Tabs
        type="card"
        activeTab={activeTab}
        onChange={(key) => navigate(`/settings?tab=${key}`)}
      >
        {readableTabs.some((tab) => tab.key === "channels") && (
          <Tabs.TabPane key="channels" title="渠道配置">
            <ChannelManagementPage embedded />
          </Tabs.TabPane>
        )}
        {readableTabs.some((tab) => tab.key === "categories") && (
          <Tabs.TabPane key="categories" title="前台展示分类">
            <Card bordered={false} className="surface" title="前台展示分类">
              <Table
                rowKey="code"
                pagination={false}
                data={categories.sort((a, b) => a.order - b.order)}
                columns={[
                  {
                    title: "一级分类",
                    dataIndex: "name",
                    render: (_, item) => <strong>{item.name}</strong>,
                  },
                  {
                    title: "二级主题数量",
                    render: (_, item) => `${item.topics.length} 个主题`,
                  },
                  {
                    title: "默认风险",
                    dataIndex: "risk",
                    render: (_, item) => <Tag>{item.risk}</Tag>,
                  },
                  { title: "排序", dataIndex: "order" },
                  {
                    title: "状态",
                    render: (_, item) => (
                      <StatusTag status={item.status ? "启用" : "停用"} />
                    ),
                  },
                  {
                    title: "操作",
                    render: (_, item) => (
                      <Space>
                        <WritePermissionButton
                          type="text"
                          allowed={canWrite("settings.categories")}
                          onClick={() => setManagingTopics(item)}
                        >
                          管理主题
                        </WritePermissionButton>
                        <WritePermissionButton
                          type="text"
                          allowed={canWrite("settings.categories")}
                          onClick={() => setEditingCategory(item)}
                        >
                          编辑分类
                        </WritePermissionButton>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          </Tabs.TabPane>
        )}
        {readableTabs.some((tab) => tab.key === "links") && (
          <Tabs.TabPane key="links" title="跳转白名单">
            <Card
              bordered={false}
              className="surface"
              title="Deep Link 与 Web URL 白名单"
              extra={
                <WritePermissionButton
                  type="primary"
                  icon={<IconPlus />}
                  allowed={canWrite("settings.links")}
                  onClick={() => setEditingLink("new")}
                >
                  新增白名单
                </WritePermissionButton>
              }
            >
              <Input.Search
                value={keyword}
                onChange={setKeyword}
                allowClear
                placeholder="搜索路径或域名"
                style={{ marginBottom: 16 }}
              />
              <div className="allowlist-table">
                <div className="allowlist-head">
                  <strong>规则</strong><strong>类型 / 平台</strong><strong>参数规则</strong>
                  <strong>生效时间</strong><strong>失效时间</strong><strong>状态 / 操作</strong>
                </div>
                {links.map((entry) => (
                  <div key={entry.id}>
                    <div><strong>{entry.name}</strong><code>{entry.pattern}</code></div>
                    <div><Tag>{entry.type}</Tag><span>{entry.platforms.join(" / ")}</span></div>
                    <span>{entry.parameterRule}</span><span>{entry.effectiveAt}</span><span>{entry.expiresAt}</span>
                    <Space>
                      <StatusTag status={entry.status} />
                      <WritePermissionButton
                        type="text"
                        allowed={canWrite("settings.links")}
                        onClick={() => setEditingLink(entry)}
                      >编辑</WritePermissionButton>
                      <WritePermissionButton
                        type="text"
                        status={entry.status === "启用" ? "danger" : "success"}
                        allowed={canWrite("settings.links")}
                        onClick={() => updateAllowlistEntry(entry.id, { status: entry.status === "启用" ? "停用" : "启用" })}
                      >{entry.status === "启用" ? "停用" : "启用"}</WritePermissionButton>
                    </Space>
                  </div>
                ))}
              </div>
            </Card>
          </Tabs.TabPane>
        )}
        {readableTabs.some((tab) => tab.key === "language-review") && (
          <Tabs.TabPane key="language-review" title="语言审核策略">
            <LanguageReviewPolicyPanel canWrite={canWrite("settings.languageReview")} />
          </Tabs.TabPane>
        )}
        {readableTabs.some((tab) => tab.key === "test-accounts") && (
          <Tabs.TabPane key="test-accounts" title="测试账号">
            <TestAccountPanel canWrite={canWrite("settings.testAccounts")} />
          </Tabs.TabPane>
        )}
        {isSuperAdmin && (
          <Tabs.TabPane key="operator-permissions" title="人员权限">
            <OperatorPermissionPanel />
          </Tabs.TabPane>
        )}
        {readableTabs.some((tab) => tab.key === "audit") && (
          <Tabs.TabPane key="audit" title="审计日志">
            <Card bordered={false} className="surface">
              <Timeline>
                {[
                  "18:12 Gary Ma 新增 Deep Link 白名单 · LINK-004",
                  "18:03 赵辰使无效 Push Token 进入抑制名单",
                  "17:58 林夏提交夏季交易赛任务 · MSG-260712-002",
                  "16:32 Gary Ma 导出脱敏后台日志 · EXP-2201",
                ].map((item) => <Timeline.Item key={item}>{item}</Timeline.Item>)}
              </Timeline>
            </Card>
          </Tabs.TabPane>
        )}
      </Tabs>
      <AllowlistEditor
        visible={Boolean(editingLink)}
        entry={editingLink === "new" ? undefined : editingLink}
        canWrite={canWrite("settings.links")}
        onClose={() => setEditingLink(undefined)}
      />
      <Modal
        title={`编辑分类 · ${editingCategory?.name || ""}`}
        visible={Boolean(editingCategory)}
        onCancel={() => setEditingCategory(undefined)}
        footer={null}
        unmountOnExit
      >
        <Form layout="vertical" initialValues={editingCategory} onSubmit={saveCategory}>
          <Form.Item label="分类名称" field="name"><Input disabled /></Form.Item>
          <Grid.Row gutter={12}>
            <Grid.Col span={8}><Form.Item label="默认风险" field="risk"><Select options={MESSAGE_RISK_LEVELS.map((value) => ({ label: value, value }))} /></Form.Item></Grid.Col>
            <Grid.Col span={8}><Form.Item label="默认保留期" field="retention"><InputNumber suffix="天" /></Form.Item></Grid.Col>
            <Grid.Col span={8}><Form.Item label="排序" field="order"><InputNumber min={1} max={5} /></Form.Item></Grid.Col>
          </Grid.Row>
          <Form.Item label="启用状态" field="status" triggerPropName="checked"><Switch /></Form.Item>
          <WritePermissionButton
            htmlType="submit"
            type="primary"
            allowed={canWrite("settings.categories")}
          >保存分类配置</WritePermissionButton>
        </Form>
      </Modal>
      <Modal
        title={`管理二级主题 · ${managingTopics?.name || ""}`}
        visible={Boolean(managingTopics)}
        onCancel={() => setManagingTopics(undefined)}
        onOk={saveTopics}
        okText="保存主题配置"
        okButtonProps={{ disabled: !canWrite("settings.categories") }}
        style={{ width: 760 }}
        unmountOnExit
      >
        <Alert
          type="info"
          content="二级主题为受控字典，模板和临时消息只能从这里启用的主题中选择。"
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="code"
          pagination={false}
          data={managingTopics?.topics || []}
          columns={[
            { title: "二级主题", dataIndex: "name" },
            {
              title: "默认风险",
              render: (_, topic: MessageTopic) => (
                <Select
                  value={topic.defaultRisk}
                  disabled={!canWrite("settings.categories")}
                  style={{ width: 120 }}
                  options={MESSAGE_RISK_LEVELS.map((value) => ({
                    label: value,
                    value,
                  }))}
                  onChange={(value) =>
                    setManagingTopics((current) =>
                      current
                        ? {
                            ...current,
                            topics: current.topics.map((item) =>
                              item.code === topic.code
                                ? { ...item, defaultRisk: value }
                                : item,
                            ),
                          }
                        : current,
                    )
                  }
                />
              ),
            },
            { title: "排序", dataIndex: "order" },
            {
              title: "状态",
              render: (_, topic: MessageTopic) => (
                <Switch
                  checked={topic.enabled}
                  disabled={!canWrite("settings.categories")}
                  onChange={(enabled) =>
                    setManagingTopics((current) =>
                      current
                        ? {
                            ...current,
                            topics: current.topics.map((item) =>
                              item.code === topic.code
                                ? { ...item, enabled }
                                : item,
                            ),
                          }
                        : current,
                    )
                  }
                />
              ),
            },
          ]}
        />
      </Modal>
    </section>
  );
}
