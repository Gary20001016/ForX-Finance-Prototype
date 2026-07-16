import {
  Alert,
  Card,
  Descriptions,
  Grid,
  Progress,
  Space,
  Tag,
  Timeline,
} from "@arco-design/web-react";
import MessagePreview from "../../components/MessagePreview";
import type {
  Channel,
  EventTriggerConfig,
  LocalizedMessageContent,
  RiskLevel,
  TaskTriggerType,
} from "../../domain/types";

export interface TaskSummaryData {
  name: string;
  nature: string;
  risk: RiskLevel;
  channels: Channel[];
  content: LocalizedMessageContent;
  audienceCount: number;
  audienceLabel: string;
  sampleUsers: string[];
  schedule: string;
  expiresAt: string;
  translationReady: boolean;
  triggerType?: TaskTriggerType;
  eventConfig?: EventTriggerConfig;
  templateVersion?: string;
}

export default function TaskSummary({ data }: { data: TaskSummaryData }) {
  const filtered = Math.max(0, Math.round(data.audienceCount * 0.047));
  const deliverable = Math.max(0, data.audienceCount - filtered);
  return (
    <div className="summary-grid">
      <div className="summary-main">
        <Alert
          type={data.risk === "高" || data.risk === "关键" ? "warning" : "info"}
          showIcon
          title={
            data.risk === "高" || data.risk === "关键"
              ? "高风险任务"
              : "提交前最终检查"
          }
          content={`预计触达 ${deliverable.toLocaleString()} 人；提交后内容、受众、渠道、时间和有效期将冻结。`}
        />
        <Card
          title="最终内容预览"
          bordered={false}
          className="inner-card"
          extra={
            <Space>
              <Tag>{data.content.sourceLocale}</Tag>
              <Tag color={data.translationReady ? "green" : "orange"}>
                {data.translationReady ? "多语言已审核" : "仅源语言可用"}
              </Tag>
            </Space>
          }
        >
          <MessagePreview
            content={data.content}
            channels={data.channels}
            compact
          />
        </Card>
        <Card title="受众计算与样例" bordered={false} className="inner-card">
          <Grid.Row gutter={12}>
            {[
              ["原始受众", data.audienceCount.toLocaleString()],
              ["合规过滤", `- ${filtered.toLocaleString()}`],
              ["最终可发送", deliverable.toLocaleString()],
            ].map(([label, value], i) => (
              <Grid.Col span={8} key={label}>
                <div className={i === 2 ? "funnel-box primary" : "funnel-box"}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              </Grid.Col>
            ))}
          </Grid.Row>
          <div className="sample-user-list">
            <strong>受众样例</strong>
            {data.sampleUsers.map((user) => (
              <Tag key={user}>{user}</Tag>
            ))}
          </div>
        </Card>
      </div>
      <div className="summary-side">
        <Card title="任务摘要" bordered={false} className="inner-card">
          <Descriptions
            column={1}
            data={[
              { label: "任务名称", value: data.name },
              {
                label: "触发方式",
                value:
                  data.triggerType === "event" ? "系统事件触发" : "人工发送",
              },
              ...(data.eventConfig
                ? [
                    { label: "事件编码", value: data.eventConfig.eventId },
                    { label: "模板版本", value: data.templateVersion || "—" },
                    {
                      label: "触发条件",
                      value:
                        data.eventConfig.conditionExpression ||
                        "事件到达即触发",
                    },
                    {
                      label: "变量映射",
                      value: `${data.eventConfig.variableMappings.length} 项`,
                    },
                    { label: "去重键", value: data.eventConfig.dedupeKey },
                    {
                      label: "重试策略",
                      value: `最多 ${data.eventConfig.maxRetries} 次 · 首次退避 ${data.eventConfig.retryBackoffSeconds} 秒`,
                    },
                  ]
                : []),
              { label: "消息性质", value: `${data.nature} · ${data.risk}风险` },
              { label: "受众", value: data.audienceLabel },
              { label: "发送时间", value: data.schedule },
              { label: "正式渠道", value: data.channels.join(" + ") },
              { label: "预计成本", value: "Web ¥0 · Push ¥0" },
              { label: "有效期", value: data.expiresAt || "未设置" },
            ]}
          />
        </Card>
        <Card title="审批链" bordered={false} className="inner-card">
          <Timeline>
            <Timeline.Item
              dotColor={data.translationReady ? "green" : "orange"}
            >
              多语言人工审核 · {data.translationReady ? "已通过" : "按语言门禁"}
            </Timeline.Item>
            <Timeline.Item>业务内容审核 · 独立审核人</Timeline.Item>
            {(data.risk === "高" || data.risk === "关键") && (
              <Timeline.Item>风险与合规审核</Timeline.Item>
            )}
            <Timeline.Item>
              {data.triggerType === "event"
                ? "启用事件触发任务"
                : "进入发送调度"}
            </Timeline.Item>
          </Timeline>
          <Progress
            percent={data.translationReady ? 50 : 25}
            status="warning"
          />
        </Card>
      </div>
    </div>
  );
}
