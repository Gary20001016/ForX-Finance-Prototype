import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Grid,
  Input,
  Message,
  Progress,
  Space,
  Statistic,
  Tag,
} from "@arco-design/web-react";
import { IconPlus, IconSettings } from "@arco-design/web-react/icon";
import PageHeader from "../../components/PageHeader";
import StatusTag from "../../components/StatusTag";
import { providers } from "../../mocks/data";
import type { ChannelProvider } from "../../domain/types";
import {
  ACTIVE_MESSAGE_CHANNELS,
  channelDisplayName,
} from "../../domain/emailChannel";
import { openDetailedForm } from "../../utils/prototypeActions";

export default function ChannelManagementPage() {
  const [selected, setSelected] = useState<ChannelProvider>();
  const activeProviders = providers.filter((provider) =>
    ACTIVE_MESSAGE_CHANNELS.includes(provider.channel),
  );

  return (
    <section className="page-stack">
      <PageHeader
        title="渠道管理"
        description="配置站内信、App Push 与 Email 的发送账号、供应商路由、限流、成本和故障切换。"
        actions={
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => openDetailedForm("provider", "接入渠道供应商")}
          >
            接入供应商
          </Button>
        }
      />
      <Alert
        type="warning"
        content="生产凭证存放在密钥管理系统，后台只展示引用和轮换状态，不回显明文。邮件投递由后台 EmailProviderAdapter 调用服务商，前端不保存 API Key。"
      />
      <Grid.Row gutter={[16, 16]}>
        {activeProviders.map((provider) => (
          <Grid.Col xs={24} md={12} key={provider.id}>
            <Card
              className="provider-card"
              bordered={false}
              title={
                <Space>
                  <span className="provider-logo">
                    {channelDisplayName(provider.channel).slice(0, 1)}
                  </span>
                  <div>
                    <strong>{provider.name}</strong>
                    <div className="muted">
                      {channelDisplayName(provider.channel)} · {provider.regions}
                    </div>
                  </div>
                </Space>
              }
              extra={
                <Button
                  type="text"
                  icon={<IconSettings />}
                  onClick={() => setSelected(provider)}
                >
                  配置
                </Button>
              }
            >
              <div className="provider-status">
                <StatusTag status={provider.status} />
                <Tag>路由优先级 P{provider.priority}</Tag>
              </div>
              <Grid.Row gutter={16}>
                <Grid.Col span={6}>
                  <Statistic title="成功率" value={provider.successRate} suffix="%" precision={2} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Statistic title="P95 延迟" value={provider.latency} suffix="ms" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Statistic title="限流" value={provider.qps} suffix=" QPS" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Statistic title="余额" value={provider.balance} />
                </Grid.Col>
              </Grid.Row>
              <Progress
                percent={provider.successRate}
                showText={false}
                size="small"
                status={provider.successRate < 99.5 ? "warning" : "success"}
              />
            </Card>
          </Grid.Col>
        ))}
      </Grid.Row>

      <Drawer
        width={680}
        visible={Boolean(selected)}
        title={selected ? `配置 ${selected.name}` : "渠道配置"}
        onCancel={() => setSelected(undefined)}
        footer={
          <Space>
            <Button onClick={() => setSelected(undefined)}>取消</Button>
            <Button onClick={() => Message.success("测试连接成功")}>测试连接</Button>
            <Button type="primary" onClick={() => Message.success("配置变更已提交审核")}>
              提交变更
            </Button>
          </Space>
        }
      >
        {selected && (
          <div className="channel-form">
            <Descriptions
              column={2}
              border
              data={[
                { label: "供应商 ID", value: selected.id },
                { label: "渠道", value: channelDisplayName(selected.channel) },
                { label: "适用地区", value: selected.regions },
                { label: "状态", value: <StatusTag status={selected.status} /> },
              ]}
            />
            <label>
              API Endpoint
              <Input defaultValue="https://api.provider.example/v2/messages" />
            </label>
            <label>
              凭证引用
              <Input.Password
                defaultValue="kms://prod/message-provider/primary"
                visibilityToggle={false}
              />
            </label>
            <label>
              回调地址
              <Input defaultValue="https://callback.forxfinance.example/delivery" />
            </label>
            {selected.channel === "邮件" && (
              <>
                <Descriptions
                  title="Email 域名与发送流"
                  column={2}
                  border
                  data={[
                    { label: "发送域名", value: "mail.forx.finance" },
                    { label: "退信域名", value: "bounce.forx.finance" },
                    { label: "事务发送流", value: "transactional" },
                    { label: "营销发送流", value: "broadcast" },
                    { label: "Webhook 事件", value: "送达 / 打开 / 点击 / 退信 / 投诉 / 退订" },
                    { label: "抑制名单同步", value: <Tag color="green">已开启</Tag> },
                  ]}
                />
                <Space wrap>
                  <Tag color="green">SPF 已通过</Tag>
                  <Tag color="green">DKIM 已通过</Tag>
                  <Tag color="green">DMARC 已通过</Tag>
                  <Tag color="arcoblue">全球发送</Tag>
                </Space>
              </>
            )}
            <div className="field-pair">
              <label>
                QPS
                <Input defaultValue={String(selected.qps)} />
              </label>
              <label>
                超时
                <Input defaultValue="3000 ms" />
              </label>
            </div>
          </div>
        )}
      </Drawer>
    </section>
  );
}
