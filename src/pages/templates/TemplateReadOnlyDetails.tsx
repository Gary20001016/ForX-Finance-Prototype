import {
  Alert,
  Descriptions,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import MessagePreview from "../../components/MessagePreview";
import StatusTag from "../../components/StatusTag";
import type { MessageTemplate } from "../../domain/types";
import { APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE } from "../../domain/templatePolicy";

const usageScopeLabel: Record<MessageTemplate["usageScope"], string> = {
  manual: "人工消息",
  event: "事件通知",
  shared: "通用",
};

export default function TemplateReadOnlyDetails({
  template,
}: {
  template: MessageTemplate;
}) {
  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        title="模板已锁定"
        content={`${APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE}，以下信息仅供查看。`}
      />

      <Descriptions
        title="模板信息"
        column={3}
        border
        data={[
          { label: "模板 ID", value: <span className="mono">{template.id}</span> },
          { label: "模板编码", value: <span className="mono">{template.code}</span> },
          { label: "模板名称", value: template.name },
          { label: "版本", value: template.version },
          { label: "状态", value: <StatusTag status={template.status} /> },
          { label: "更新时间", value: template.updatedAt },
          { label: "消息分类", value: template.category },
          { label: "消息性质", value: template.nature },
          { label: "风险等级", value: template.risk },
          { label: "适用场景", value: usageScopeLabel[template.usageScope] },
          { label: "所有者团队", value: template.owner || "—" },
          { label: "默认语言", value: template.sourceLocale },
          {
            label: "正式渠道",
            value: (
              <Space wrap>
                {template.channels.map((channel) => (
                  <Tag key={channel}>{channel}</Tag>
                ))}
              </Space>
            ),
          },
          {
            label: "语言覆盖",
            value: template.locales.join(" · "),
          },
          {
            label: "模板变量",
            value: template.variables?.length ? (
              <Space wrap>
                {template.variables.map((variable) => (
                  <Tag color="arcoblue" key={variable}>
                    {`{{ ${variable} }}`}
                  </Tag>
                ))}
              </Space>
            ) : (
              "无"
            ),
          },
        ]}
      />

      <div>
        <Typography.Title heading={6}>默认语言内容预览</Typography.Title>
        {template.content ? (
          <MessagePreview content={template.content} />
        ) : (
          <Alert type="warning" showIcon content="当前模板没有可预览的内容快照。" />
        )}
      </div>
    </Space>
  );
}
