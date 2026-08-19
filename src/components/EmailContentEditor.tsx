import { Form, Grid, Input, Select, Switch } from "@arco-design/web-react";
import type {
  ControlledTemplateVariable,
  EmailChannelConfig,
  EmailMessageContent,
  EmailType,
} from "../domain/types";
import { EMAIL_SENDER_PROFILES } from "../domain/emailChannel";
import VariableTextArea from "./VariableTextArea";

export default function EmailContentEditor({
  content,
  config,
  variables,
  onContentChange,
  onConfigChange,
}: {
  content: EmailMessageContent;
  config: EmailChannelConfig;
  variables: ControlledTemplateVariable[];
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

  return (
    <Form layout="vertical">
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
      <Form.Item label="邮件正文标题">
        <VariableTextArea
          ariaLabel="邮件正文标题"
          value={content.headline}
          onChange={(headline) => onContentChange({ headline })}
          variables={variables}
        />
      </Form.Item>
      <Grid.Row gutter={12}>
        <Grid.Col span={12}>
          <Form.Item label="邮件正文（HTML 样式内容）">
            <VariableTextArea
              ariaLabel="邮件 HTML 正文"
              value={content.body}
              onChange={(body) => onContentChange({ body })}
              variables={variables}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={12}>
          <Form.Item label="邮件纯文本正文">
            <VariableTextArea
              ariaLabel="邮件纯文本正文"
              value={content.textBody}
              onChange={(textBody) => onContentChange({ textBody })}
              variables={variables}
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
      <Grid.Row gutter={12}>
        <Grid.Col span={6}>
          <Form.Item label="按钮文案">
            <Input value={content.actionText} onChange={(actionText) => onContentChange({ actionText })} />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={12}>
          <Form.Item label="按钮链接">
            <Input aria-label="邮件按钮链接" value={content.actionUrl} onChange={(actionUrl) => onContentChange({ actionUrl })} />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={6}>
          <Form.Item label="打开/点击追踪">
            <Switch checked={config.trackingEnabled} onChange={(trackingEnabled) => onConfigChange({ trackingEnabled })} />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
      <Form.Item label="页脚文案">
        <Input value={content.footerText} onChange={(footerText) => onContentChange({ footerText })} />
      </Form.Item>
      {config.emailType === "营销邮件" && (
        <Form.Item label="退订文案" required>
          <Input.TextArea
            aria-label="邮件退订文案"
            value={content.unsubscribeText}
            onChange={(unsubscribeText) => onContentChange({ unsubscribeText })}
          />
        </Form.Item>
      )}
    </Form>
  );
}
