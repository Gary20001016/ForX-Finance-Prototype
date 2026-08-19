import { Form, Grid, Input, Modal, Radio, Select, Switch } from "@arco-design/web-react";
import type {
  ControlledTemplateVariable,
  EmailBodyMode,
  EmailChannelConfig,
  EmailMessageContent,
  EmailType,
} from "../domain/types";
import { EMAIL_SENDER_PROFILES, getEmailBodyMode } from "../domain/emailChannel";
import VariableTextArea from "./VariableTextArea";
import EmailHtmlUploadPanel from "./EmailHtmlUploadPanel";

export default function EmailContentEditor({
  content,
  config,
  variables,
  sourceLocale,
  locales,
  onContentChange,
  onConfigChange,
}: {
  content: EmailMessageContent;
  config: EmailChannelConfig;
  variables: ControlledTemplateVariable[];
  sourceLocale: string;
  locales: string[];
  onContentChange: (changes: Partial<EmailMessageContent>) => void;
  onConfigChange: (changes: Partial<EmailChannelConfig>) => void;
}) {
  const changeType = (emailType: EmailType) => {
    const sender = EMAIL_SENDER_PROFILES.find((item) =>
      emailType === "营销邮件" ? item.id === "marketing" : item.id === "transaction",
    );
    onConfigChange({
      emailType,
      senderProfileId: sender?.id || "transaction",
      fromName: sender?.name || "ForX Finance 通知",
      unsubscribeRequired: emailType === "营销邮件",
    });
    if (emailType === "营销邮件" && !content.unsubscribeText) {
      onContentChange({ unsubscribeText: "如果不想继续接收此类邮件，可取消订阅。" });
    }
  };

  const bodyMode = getEmailBodyMode(content);
  const changeBodyMode = (nextMode: EmailBodyMode) => {
    if (nextMode === bodyMode) return;
    const hasActiveContent =
      bodyMode === "text"
        ? Boolean(content.textBody.trim())
        : Boolean(Object.keys(content.htmlAssets || {}).length);
    const apply = () => onContentChange({ bodyMode: nextMode });
    if (!hasActiveContent) {
      apply();
      return;
    }
    Modal.confirm({
      title: "切换邮件正文类型？",
      content: "当前正文和相关审核结果将不再参与预览与发布，草稿内容会保留以便恢复。",
      onOk: apply,
    });
  };

  return (
    <div className="email-content-editor">
      <Grid.Row gutter={12}>
        <Grid.Col span={8}>
          <Form.Item label="邮件类型">
            <Select
              aria-label="邮件类型"
              value={config.emailType}
              onChange={changeType}
              options={["事务邮件", "营销邮件"].map((value) => ({ label: value, value }))}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={8}>
          <Form.Item label="发件人身份">
            <Select
              aria-label="发件人身份"
              value={config.senderProfileId}
              onChange={(senderProfileId) => {
                const sender = EMAIL_SENDER_PROFILES.find((item) => item.id === senderProfileId);
                onConfigChange({ senderProfileId, fromName: sender?.name || config.fromName });
              }}
              options={EMAIL_SENDER_PROFILES.map((item) => ({
                label: `${item.name} <${item.address}>`,
                value: item.id,
              }))}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={8}>
          <Form.Item label="回复地址">
            <Input
              aria-label="邮件回复地址"
              value={config.replyTo}
              onChange={(replyTo) => onConfigChange({ replyTo })}
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
      <Grid.Row gutter={12}>
        <Grid.Col span={12}>
          <Form.Item label="邮件标题">
            <VariableTextArea
              ariaLabel="邮件标题"
              value={content.subject}
              onChange={(subject) => onContentChange({ subject })}
              variables={variables}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={12}>
          <Form.Item label="收件箱预览文字">
            <VariableTextArea
              ariaLabel="邮件预览文字"
              value={content.preheader || ""}
              onChange={(preheader) => onContentChange({ preheader })}
              variables={variables}
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
      <Form.Item label="正文类型">
        <Radio.Group
          aria-label="邮件正文类型"
          type="button"
          value={bodyMode}
          onChange={changeBodyMode}
        >
          <Radio value="text">纯文本</Radio>
          <Radio value="html">HTML 文件</Radio>
        </Radio.Group>
      </Form.Item>
      {bodyMode === "text" ? (
        <Form.Item label="邮件纯文本正文">
          <VariableTextArea
            ariaLabel="邮件纯文本正文"
            value={content.textBody}
            onChange={(textBody) => onContentChange({ textBody })}
            variables={variables}
          />
        </Form.Item>
      ) : (
        <EmailHtmlUploadPanel
          locales={locales}
          sourceLocale={sourceLocale}
          assets={content.htmlAssets || {}}
          emailType={config.emailType}
          declaredVariables={variables.filter((item) => item.status === "启用").map((item) => item.name)}
          onChange={(htmlAssets) => onContentChange({ htmlAssets })}
        />
      )}
      <Form.Item label="打开/点击追踪">
        <Switch checked={config.trackingEnabled} onChange={(trackingEnabled) => onConfigChange({ trackingEnabled })} />
      </Form.Item>
      {bodyMode === "text" && config.emailType === "营销邮件" && (
        <Form.Item label="退订文案" required>
          <Input.TextArea
            aria-label="邮件退订文案"
            value={content.unsubscribeText}
            onChange={(unsubscribeText) => onContentChange({ unsubscribeText })}
          />
        </Form.Item>
      )}
    </div>
  );
}
