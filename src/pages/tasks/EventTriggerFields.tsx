import {
  Alert,
  Descriptions,
  Form,
  Grid,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
} from "@arco-design/web-react";
import type {
  EventTriggerConfig,
  MessageTemplate,
  SystemEventDefinition,
} from "../../domain/types";

const FormItem = Form.Item;

export const createDefaultEventConfig = (
  event: SystemEventDefinition,
  template?: MessageTemplate,
): EventTriggerConfig => ({
  eventId: event.id,
  eventVersion: event.version,
  conditionExpression: "",
  variableMappings: (template?.variables || []).map((variable) => ({
    eventField: event.variables.includes(variable) ? variable : "",
    templateVariable: variable,
    required: true,
  })),
  dedupeKey: "{{ event_id }}:{{ user_id }}",
  eventTtlSeconds: 300,
  maxRetries: 3,
  retryBackoffSeconds: 30,
});

interface EventTriggerFieldsProps {
  events: SystemEventDefinition[];
  templates: MessageTemplate[];
  eventId?: string;
  templateId?: string;
  value?: EventTriggerConfig;
  onEventChange: (eventId: string, config: EventTriggerConfig) => void;
  onTemplateChange: (templateId: string, config: EventTriggerConfig) => void;
  onChange: (config: EventTriggerConfig) => void;
}

export default function EventTriggerFields({
  events,
  templates,
  eventId,
  templateId,
  value,
  onEventChange,
  onTemplateChange,
  onChange,
}: EventTriggerFieldsProps) {
  const event = events.find((item) => item.id === eventId);
  const template = templates.find((item) => item.id === templateId);
  const patch = (changes: Partial<EventTriggerConfig>) =>
    value && onChange({ ...value, ...changes });
  const chooseEvent = (id: string) => {
    const selected = events.find((item) => item.id === id);
    if (selected)
      onEventChange(id, createDefaultEventConfig(selected, template));
  };
  const chooseTemplate = (id: string) => {
    const selected = templates.find((item) => item.id === id);
    if (event && selected)
      onTemplateChange(id, createDefaultEventConfig(event, selected));
  };
  const updateMapping = (templateVariable: string, eventField: string) =>
    value &&
    patch({
      variableMappings: value.variableMappings.map((item) =>
        item.templateVariable === templateVariable
          ? { ...item, eventField }
          : item,
      ),
    });

  return (
    <div className="template-source-panel event-trigger-panel">
      <h3>系统事件触发配置</h3>
      <Alert
        type="info"
        content="系统事件只定义业务事实和字段；当前任务负责选择模板、配置条件、变量映射、去重与重试，审核通过后才会启用。"
      />
      <Grid.Row gutter={20} style={{ marginTop: 16 }}>
        <Grid.Col span={12}>
          <FormItem label="系统事件" required>
            <Select
              aria-label="系统事件"
              value={eventId}
              onChange={chooseEvent}
              showSearch
              options={events.map((item) => ({
                label: `${item.name} · ${item.id}`,
                value: item.id,
              }))}
            />
          </FormItem>
        </Grid.Col>
        <Grid.Col span={12}>
          <FormItem
            label="已发布模板"
            required
            extra="仅可选择多语言全部人工审核通过的已发布版本"
          >
            <Select
              aria-label="已发布模板"
              value={templateId}
              onChange={chooseTemplate}
              options={templates.map((item) => ({
                label: `${item.name} · ${item.version}`,
                value: item.id,
              }))}
            />
          </FormItem>
        </Grid.Col>
      </Grid.Row>
      {event && (
        <Descriptions
          column={4}
          border
          data={[
            {
              label: "事件编码",
              value: <span className="mono">{event.id}</span>,
            },
            { label: "事件版本", value: event.version },
            { label: "业务线", value: event.line },
            { label: "调用方", value: event.caller },
          ]}
        />
      )}
      {value && (
        <>
          <Grid.Row gutter={20} style={{ marginTop: 16 }}>
            <Grid.Col span={12}>
              <FormItem label="触发条件" extra="留空表示事件到达即触发">
                <Input
                  aria-label="触发条件"
                  value={value.conditionExpression}
                  onChange={(conditionExpression) =>
                    patch({ conditionExpression })
                  }
                  placeholder="例如：margin_rate < 0.2"
                />
              </FormItem>
            </Grid.Col>
            <Grid.Col span={12}>
              <FormItem label="去重键" required extra="支持事件字段占位符">
                <Input
                  aria-label="去重键"
                  value={value.dedupeKey}
                  onChange={(dedupeKey) => patch({ dedupeKey })}
                />
              </FormItem>
            </Grid.Col>
          </Grid.Row>
          <Grid.Row gutter={20}>
            <Grid.Col span={8}>
              <FormItem label="事件有效期（秒）">
                <InputNumber
                  aria-label="事件有效期"
                  min={1}
                  max={604800}
                  value={value.eventTtlSeconds}
                  onChange={(eventTtlSeconds) => patch({ eventTtlSeconds })}
                  style={{ width: "100%" }}
                />
              </FormItem>
            </Grid.Col>
            <Grid.Col span={8}>
              <FormItem label="最大重试次数">
                <InputNumber
                  aria-label="最大重试次数"
                  min={0}
                  max={10}
                  value={value.maxRetries}
                  onChange={(maxRetries) => patch({ maxRetries })}
                  style={{ width: "100%" }}
                />
              </FormItem>
            </Grid.Col>
            <Grid.Col span={8}>
              <FormItem label="首次退避（秒）">
                <InputNumber
                  aria-label="首次退避"
                  min={1}
                  max={3600}
                  value={value.retryBackoffSeconds}
                  onChange={(retryBackoffSeconds) =>
                    patch({ retryBackoffSeconds })
                  }
                  style={{ width: "100%" }}
                />
              </FormItem>
            </Grid.Col>
          </Grid.Row>
          <div className="section-divider" />
          <h3>变量映射</h3>
          <Space direction="vertical" style={{ width: "100%" }}>
            {value.variableMappings.map((mapping) => (
              <div className="event-mapping-row" key={mapping.templateVariable}>
                <Tag color="arcoblue">模板变量</Tag>
                <span className="mono">{`{{ ${mapping.templateVariable} }}`}</span>
                <span>←</span>
                <Select
                  aria-label={`映射 ${mapping.templateVariable}`}
                  value={mapping.eventField || undefined}
                  onChange={(field) =>
                    updateMapping(mapping.templateVariable, field)
                  }
                  placeholder="选择事件字段"
                  options={(event?.variables || []).map((field) => ({
                    label: field,
                    value: field,
                  }))}
                  style={{ width: 260 }}
                />
                {mapping.required && (
                  <Tag color={mapping.eventField ? "green" : "red"}>
                    {mapping.eventField ? "已映射" : "必填"}
                  </Tag>
                )}
              </div>
            ))}
          </Space>
        </>
      )}
    </div>
  );
}
