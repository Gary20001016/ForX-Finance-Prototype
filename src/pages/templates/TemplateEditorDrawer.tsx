import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Form,
  Grid,
  Input,
  Message,
  Select,
  Space,
  Tabs,
} from "@arco-design/web-react";
import MessagePreview from "../../components/MessagePreview";
import type {
  LocalizedMessageContent,
  MessageTemplate,
  TemplateUsageScope,
} from "../../domain/types";
import {
  createTranslationBatch,
  saveTemplate,
  updateTemplate,
} from "../../store/prototypeStore";

const categories = [
  "系统公告",
  "交易通知",
  "资产通知",
  "安全通知",
  "奖励通知",
  "活动通知",
  "风控通知",
];
const locales = [
  "en-US",
  "zh-TW",
  "ja-JP",
  "ko-KR",
  "es-ES",
  "tr-TR",
  "ru-RU",
  "fr-FR",
  "de-DE",
];
const emptyContent: LocalizedMessageContent = {
  sourceLocale: "zh-CN",
  locales: ["zh-CN"],
  web: {
    title: "",
    summary: "",
    body: "",
    actionText: "查看详情",
    targetUrl: "forxfinance://security/devices",
  },
  push: {
    title: "",
    body: "",
    deepLink: "forxfinance://security/devices",
    platform: "全部设备",
    priority: "高",
  },
};

export default function TemplateEditorDrawer({
  visible,
  template,
  onClose,
  onCreated,
  entryScope,
}: {
  visible: boolean;
  template?: MessageTemplate;
  entryScope: Exclude<TemplateUsageScope, "shared">;
  onClose: () => void;
  onCreated?: (template: MessageTemplate) => void;
}) {
  const [form] = Form.useForm();
  const [content, setContent] = useState<LocalizedMessageContent>(emptyContent);
  const [targetLocales, setTargetLocales] = useState<string[]>(["en-US"]);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const next = template?.content || emptyContent;
    setContent(JSON.parse(JSON.stringify(next)));
    setTargetLocales(
      (template?.locales || ["zh-CN", "en-US"]).filter(
        (item) => item !== (template?.sourceLocale || "zh-CN"),
      ),
    );
    form.setFieldsValue({
      code: template?.code,
      name: template?.name,
      description: "",
      category: template?.category || "系统公告",
      nature: template?.nature || "事务",
      risk: template?.risk || "中",
      sourceLocale: template?.sourceLocale || "zh-CN",
      channels: template?.channels || ["站内信", "Push"],
      owner: template?.owner || "消息运营",
      usageScope: template?.usageScope || entryScope,
      variables: (
        template?.variables || [
          "user_nickname",
          "amount",
          "currency",
          "symbol",
          "occurred_at",
        ]
      ).join(", "),
    });
  }, [template, visible, form, entryScope]);

  const patchWeb = (changes: Partial<LocalizedMessageContent["web"]>) =>
    setContent((current) => ({
      ...current,
      web: { ...current.web, ...changes },
    }));
  const patchPush = (changes: Partial<LocalizedMessageContent["push"]>) =>
    setContent((current) => ({
      ...current,
      push: { ...current.push, ...changes },
    }));
  const save = async (translate: boolean) => {
    try {
      const values = await form.validate();
      if (
        !content.web.title ||
        !content.web.summary ||
        !content.web.body ||
        !content.push.title ||
        !content.push.body
      ) {
        Message.warning("请完整填写站内信与 App Push 内容");
        return;
      }
      if (translate && targetLocales.length === 0) {
        Message.warning("请至少选择一个目标语言");
        return;
      }
      setSubmitting(true);
      const payload = {
        code: values.code,
        name: values.name,
        category: values.category,
        nature: values.nature,
        risk: values.risk,
        channels: values.channels,
        locales: [values.sourceLocale, ...targetLocales],
        sourceLocale: values.sourceLocale,
        content: {
          ...content,
          sourceLocale: values.sourceLocale,
          locales: [values.sourceLocale, ...targetLocales],
        },
        variables: values.variables
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean),
        owner: values.owner,
        usageScope: values.usageScope,
      };
      const entity = template
        ? updateTemplate(template.id, payload)
        : saveTemplate(payload);
      if (translate)
        createTranslationBatch({
          templateId: entity.id,
          targetLocales,
          createdBy: "Gary Ma",
        });
      Message.success(
        translate ? "模板已保存，并已创建外部机翻任务" : "模板草稿已保存",
      );
      onCreated?.(entity);
      onClose();
    } catch {
      /* Form displays validation */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      width={1080}
      visible={visible}
      title={template ? `编辑模板 · ${template.name}` : "新建消息模板"}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={() => save(false)}>保存草稿</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => save(true)}
          >
            提交外部机翻
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        content="默认语言由操作者维护；目标语言提交平台后台的外部异步机翻任务，返回后必须逐语言人工审核。"
      />
      <Form form={form} layout="vertical" className="template-editor-form">
        <Grid.Row gutter={16}>
          <Grid.Col span={6}>
            <Form.Item
              label="模板编码"
              field="code"
              required
              rules={[{ required: true }]}
            >
              <Input placeholder="snake_case，例如 risk_alert" />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={6}>
            <Form.Item
              label="模板名称"
              field="name"
              required
              rules={[{ required: true }]}
            >
              <Input placeholder="后台识别名称" />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={6}>
            <Form.Item label="所有者团队" field="owner" required>
              <Select
                options={["消息运营", "增长运营", "安全中心", "资金平台"].map(
                  (value) => ({ label: value, value }),
                )}
              />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={6}>
            <Form.Item label="适用场景" field="usageScope" required>
              <Select
                options={[
                  {
                    label: entryScope === "event" ? "事件通知" : "人工消息",
                    value: entryScope,
                  },
                  { label: "通用", value: "shared" },
                ]}
              />
            </Form.Item>
          </Grid.Col>
        </Grid.Row>
        <Grid.Row gutter={16}>
          <Grid.Col span={6}>
            <Form.Item label="消息分类" field="category" required>
              <Select
                options={categories.map((value) => ({ label: value, value }))}
              />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={6}>
            <Form.Item label="消息性质" field="nature">
              <Select
                options={["事务", "服务", "营销"].map((value) => ({
                  label: value,
                  value,
                }))}
              />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={6}>
            <Form.Item label="风险等级" field="risk">
              <Select
                options={["低", "中", "高", "关键"].map((value) => ({
                  label: value,
                  value,
                }))}
              />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={6}>
            <Form.Item label="默认语言" field="sourceLocale">
              <Select
                options={["zh-CN", "en-US"].map((value) => ({
                  label: value,
                  value,
                }))}
              />
            </Form.Item>
          </Grid.Col>
        </Grid.Row>
        <Grid.Row gutter={16}>
          <Grid.Col span={10}>
            <Form.Item label="正式渠道" field="channels">
              <Checkbox.Group options={["站内信", "Push"]} />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={14}>
            <Form.Item label="目标语言">
              <Select
                mode="multiple"
                value={targetLocales}
                onChange={setTargetLocales}
                options={locales.map((value) => ({ label: value, value }))}
              />
            </Form.Item>
          </Grid.Col>
        </Grid.Row>
        <Form.Item
          label="模板变量"
          field="variables"
          extra="逗号分隔；提交机翻前后都会检查变量名称与数量"
        >
          <Input />
        </Form.Item>
      </Form>
      <Tabs defaultActiveTab="content">
        <Tabs.TabPane key="content" title="内容编辑">
          <Grid.Row gutter={20}>
            <Grid.Col span={12}>
              <h3>站内信（Web + App 共用）</h3>
              <Form layout="vertical">
                <Form.Item label="站内信标题">
                  <Input
                    aria-label="站内信标题"
                    value={content.web.title}
                    onChange={(value) => patchWeb({ title: value })}
                  />
                </Form.Item>
                <Form.Item label="站内信摘要">
                  <Input.TextArea
                    aria-label="站内信摘要"
                    value={content.web.summary}
                    onChange={(value) => patchWeb({ summary: value })}
                  />
                </Form.Item>
                <Form.Item label="站内信正文">
                  <Input.TextArea
                    aria-label="站内信正文"
                    rows={5}
                    value={content.web.body}
                    onChange={(value) => patchWeb({ body: value })}
                  />
                </Form.Item>
                <Form.Item label="风险提示">
                  <Input
                    value={content.web.riskCopy}
                    onChange={(value) => patchWeb({ riskCopy: value })}
                  />
                </Form.Item>
                <Grid.Row gutter={12}>
                  <Grid.Col span={8}>
                    <Form.Item label="按钮文案">
                      <Input
                        value={content.web.actionText}
                        onChange={(value) => patchWeb({ actionText: value })}
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={16}>
                    <Form.Item label="跳转链接">
                      <Input
                        value={content.web.targetUrl}
                        onChange={(value) => patchWeb({ targetUrl: value })}
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </Form>
            </Grid.Col>
            <Grid.Col span={12}>
              <h3>App Push</h3>
              <Form layout="vertical">
                <Form.Item label="Push 标题">
                  <Input
                    aria-label="Push 标题"
                    value={content.push.title}
                    onChange={(value) => patchPush({ title: value })}
                  />
                </Form.Item>
                <Form.Item label="Push 正文">
                  <Input.TextArea
                    value={content.push.body}
                    onChange={(value) => patchPush({ body: value })}
                  />
                </Form.Item>
                <Form.Item label="Push 图片">
                  <Input
                    value={content.push.imageUrl}
                    onChange={(value) => patchPush({ imageUrl: value })}
                    placeholder="https://..."
                  />
                </Form.Item>
                <Form.Item label="Push Deep Link">
                  <Input
                    aria-label="Push Deep Link"
                    value={content.push.deepLink}
                    onChange={(value) => patchPush({ deepLink: value })}
                  />
                </Form.Item>
                <Grid.Row gutter={12}>
                  <Grid.Col span={8}>
                    <Form.Item label="设备平台">
                      <Select
                        value={content.push.platform}
                        onChange={(value) => patchPush({ platform: value })}
                        options={["全部设备", "iOS", "Android"].map(
                          (value) => ({ label: value, value }),
                        )}
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="优先级">
                      <Select
                        value={content.push.priority}
                        onChange={(value) => patchPush({ priority: value })}
                        options={["普通", "高", "紧急"].map((value) => ({
                          label: value,
                          value,
                        }))}
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="折叠键">
                      <Input
                        value={content.push.collapseKey}
                        onChange={(value) => patchPush({ collapseKey: value })}
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </Form>
            </Grid.Col>
          </Grid.Row>
        </Tabs.TabPane>
        <Tabs.TabPane key="preview" title="双端预览">
          <MessagePreview content={content} />
        </Tabs.TabPane>
      </Tabs>
    </Drawer>
  );
}
