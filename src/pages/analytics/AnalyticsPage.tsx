import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Grid,
  Message,
  Progress,
  Select,
  Statistic,
  Tag,
} from "@arco-design/web-react";
import { IconDownload } from "@arco-design/web-react/icon";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import {
  getTopicsForCategory,
  MESSAGE_DISPLAY_CATEGORIES,
  MESSAGE_RISK_LEVELS,
} from "../../domain/messageDisplayTaxonomy";
import type {
  MessageCategoryCode,
  MessageTopicCode,
  RiskLevel,
} from "../../domain/types";
import { usePrototypeStore } from "../../store/prototypeStore";

const categoryMetrics: Record<
  MessageCategoryCode,
  { rate: number; count: number }
> = {
  announcement: { rate: 82.4, count: 420 },
  trade: { rate: 72.8, count: 1280 },
  asset: { rate: 91.6, count: 860 },
  security_risk: { rate: 96.8, count: 500 },
  campaign_reward: { rate: 58.2, count: 1500 },
};

export default function AnalyticsPage() {
  const store = usePrototypeStore();
  const [range, setRange] = useState("近7天");
  const [category, setCategory] = useState<MessageCategoryCode>();
  const [topic, setTopic] = useState<MessageTopicCode>();
  const [source, setSource] = useState<"人工消息" | "系统事件">();
  const [risk, setRisk] = useState<RiskLevel>();
  const [locale, setLocale] = useState<string>();
  const [channel, setChannel] = useState<"all" | "站内信" | "Push">("all");
  const [client, setClient] = useState<"all" | "Web" | "App">("all");

  const records = useMemo(
    () =>
      store.deliveries.filter(
        (record) =>
          (channel === "all" || record.channel === channel) &&
          (client === "all" ||
            (client === "Web" && record.devicePlatform === "Web") ||
            (client === "App" &&
              (record.devicePlatform === "iOS" ||
                record.devicePlatform === "Android"))) &&
          (!category || record.category === category) &&
          (!topic || record.topic === topic) &&
          (!source || record.source === source) &&
          (!risk || record.risk === risk) &&
          (!locale || record.locale === locale),
      ),
    [store.deliveries, channel, client, category, topic, source, risk, locale],
  );

  const metrics = (selectedChannel: "站内信" | "Push") => {
    const rows = records.filter((item) => item.channel === selectedChannel);
    const sent = rows.length;
    const delivered = rows.filter((item) =>
      ["已送达", "已打开", "已点击"].includes(item.status),
    ).length;
    const failed = rows.filter((item) => Boolean(item.error)).length;
    const clicked = rows.filter(
      (item) => item.status === "已点击" || item.clickedAt,
    ).length;
    const retries = rows.reduce((sum, item) => sum + item.retryCount, 0);
    return {
      sent,
      deliveryRate: sent ? (delivered / sent) * 100 : 0,
      failureRate: sent ? (failed / sent) * 100 : 0,
      clickRate: sent ? (clicked / sent) * 100 : 0,
      retries,
      cost:
        selectedChannel === "Push" ? "¥0（APNs/FCM）" : "¥0（内部服务）",
    };
  };

  const inbox = metrics("站内信");
  const push = metrics("Push");
  const visibleCategories = MESSAGE_DISPLAY_CATEGORIES.filter(
    (item) => !category || item.code === category,
  );
  const reset = () => {
    setRange("近7天");
    setCategory(undefined);
    setTopic(undefined);
    setSource(undefined);
    setRisk(undefined);
    setLocale(undefined);
    setChannel("all");
    setClient("all");
  };

  return (
    <section className="page-stack">
      <PageHeader
        title="数据分析"
        description="按用户实际看到的一级分类、二级主题、来源、风险和渠道统计消息表现。"
        actions={
          <Button
            icon={<IconDownload />}
            onClick={() =>
              Message.success(
                `已按当前筛选创建 ${records.length} 条记录的分析报表`,
              )
            }
          >
            导出报表
          </Button>
        }
      />
      <FilterBar onReset={reset}>
        <Select
          value={range}
          onChange={setRange}
          style={{ width: 120 }}
          options={["近7天", "近30天"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <Select
          placeholder="一级分类"
          value={category}
          onChange={(value) => {
            setCategory(value);
            setTopic(undefined);
          }}
          allowClear
          style={{ width: 150 }}
          options={MESSAGE_DISPLAY_CATEGORIES.map((item) => ({
            label: item.name,
            value: item.code,
          }))}
        />
        <Select
          placeholder="二级主题"
          value={topic}
          onChange={setTopic}
          allowClear
          disabled={!category}
          style={{ width: 150 }}
          options={(category ? getTopicsForCategory(category) : []).map(
            (item) => ({ label: item.name, value: item.code }),
          )}
        />
        <Select
          placeholder="消息来源"
          value={source}
          onChange={setSource}
          allowClear
          style={{ width: 140 }}
          options={[
            { label: "人工消息", value: "人工消息" },
            { label: "系统事件", value: "系统事件" },
          ]}
        />
        <Select
          placeholder="风险等级"
          value={risk}
          onChange={setRisk}
          allowClear
          style={{ width: 130 }}
          options={MESSAGE_RISK_LEVELS.map((value) => ({
            label: value,
            value,
          }))}
        />
        <Select
          aria-label="消息渠道"
          value={channel}
          onChange={setChannel}
          style={{ width: 150 }}
          options={[
            { label: "全部渠道", value: "all" },
            { label: "站内信", value: "站内信" },
            { label: "App Push", value: "Push" },
          ]}
        />
        <Select
          aria-label="访问客户端"
          value={client}
          onChange={setClient}
          style={{ width: 150 }}
          options={[
            { label: "全部客户端", value: "all" },
            { label: "Web", value: "Web" },
            { label: "App", value: "App" },
          ]}
        />
        <Select
          placeholder="语言"
          value={locale}
          onChange={setLocale}
          allowClear
          style={{ width: 120 }}
          options={["zh-CN", "en-US", "ja-JP", "tr-TR"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <Tag color="arcoblue">渠道与访问客户端分开统计</Tag>
      </FilterBar>

      <div className="analytics-kpis v2-kpis">
        {[
          ["生成消息数", `${Math.max(records.length, 1) * 3.3}M`, "当前筛选"],
          ["触达用户数", `${Math.max(records.length, 1) * 3.1}M`, "去重 UID"],
          ["阅读率", "34.26%", "+2.1pp"],
          ["点击率", "8.87%", "+0.6pp"],
          ["过期未读", "18,420", "-12.4%"],
        ].map(([title, value, note]) => (
          <Card key={title} bordered={false}>
            <Statistic title={title} value={value} />
            <span className="kpi-note">{note}</span>
          </Card>
        ))}
      </div>

      <Grid.Row gutter={[16, 16]}>
        <Grid.Col span={12}>
          <Card
            bordered={false}
            className="surface channel-metric-card"
            title="站内信（Web + App）"
            extra={<Tag color="arcoblue">共享消息与已读状态</Tag>}
          >
            <div className="channel-metric-grid">
              {[
                ["发送数", inbox.sent],
                ["送达率", `${inbox.deliveryRate.toFixed(1)}%`],
                ["失败率", `${inbox.failureRate.toFixed(1)}%`],
                ["阅读率", "38.6%"],
                ["点击率", `${inbox.clickRate.toFixed(1)}%`],
                ["重试次数", inbox.retries],
                ["渠道成本", inbox.cost],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={12}>
          <Card
            bordered={false}
            className="surface channel-metric-card"
            title="App Push"
            extra={<Tag color="purple">APNs / FCM</Tag>}
          >
            <div className="channel-metric-grid">
              {[
                ["发送数", push.sent],
                ["送达率", `${push.deliveryRate.toFixed(1)}%`],
                ["失败率", `${push.failureRate.toFixed(1)}%`],
                ["点击率", `${push.clickRate.toFixed(1)}%`],
                ["重试次数", push.retries],
                [
                  "失效 Token",
                  records.filter((item) => item.tokenStatus === "已失效")
                    .length,
                ],
                ["渠道成本", push.cost],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </Card>
        </Grid.Col>
      </Grid.Row>

      <Grid.Row gutter={[16, 16]}>
        <Grid.Col xs={24} lg={15}>
          <Card
            bordered={false}
            className="surface"
            title="阅读与点击趋势"
            extra={<Tag>数据延迟 8 分钟</Tag>}
          >
            <div className="reading-trend">
              {[
                ["07-07", 42, 12],
                ["07-08", 55, 18],
                ["07-09", 48, 15],
                ["07-10", 68, 24],
                ["07-11", 62, 20],
                ["07-12", 78, 29],
                ["07-13", 72, 26],
              ].map(([day, read, click]) => (
                <div key={day as string}>
                  <div className="trend-bars">
                    <i style={{ height: `${read}%` }} />
                    <b style={{ height: `${click}%` }} />
                  </div>
                  <span>{day}</span>
                </div>
              ))}
            </div>
            <div className="trend-legend">
              <span>
                <i />
                阅读用户
              </span>
              <span>
                <b />
                点击用户
              </span>
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col xs={24} lg={9}>
          <Card
            bordered={false}
            className="surface risk-metric-card"
            title="风险消息阅读时效"
            extra={<Tag color="red">关键</Tag>}
          >
            <div className="risk-read-metric">
              <span>5 分钟阅读率</span>
              <strong>72.8%</strong>
              <Progress
                percent={72.8}
                status="warning"
                showText={false}
              />
            </div>
            <div className="risk-read-metric">
              <span>30 分钟阅读率</span>
              <strong>94.6%</strong>
              <Progress
                percent={94.6}
                status="success"
                showText={false}
              />
            </div>
            <div className="risk-unread-alert">
              <span>过期仍未读</span>
              <strong>286</strong>
              <small>强平 42 · 提现风险 86 · 账户异常 158</small>
            </div>
          </Card>
        </Grid.Col>
      </Grid.Row>

      <Grid.Row gutter={[16, 16]}>
        <Grid.Col xs={24} lg={16}>
          <Card bordered={false} className="surface" title="分类表现">
            <div className="category-performance">
              <div className="category-head">
                <span>一级分类</span>
                <span>消息量</span>
                <span>阅读率</span>
                <span>表现</span>
              </div>
              {visibleCategories.map((item) => {
                const metric = categoryMetrics[item.code];
                return (
                  <div key={item.code}>
                    <strong>{item.name}</strong>
                    <span>{metric.count}K</span>
                    <span>{metric.rate}%</span>
                    <Progress
                      percent={metric.rate}
                      size="small"
                      showText={false}
                      status={metric.rate > 90 ? "success" : "normal"}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col xs={24} lg={8}>
          <Card bordered={false} className="surface" title="失败原因与重试">
            <div className="source-comparison">
              <div>
                <span>临时失败</span>
                <strong>{records.filter((item) => item.retryable).length}</strong>
                <small>允许指数退避重试</small>
              </div>
              <div>
                <span>永久失败</span>
                <strong>
                  {
                    records.filter((item) => item.error && !item.retryable)
                      .length
                  }
                </strong>
                <small>Token 失效或配置错误</small>
              </div>
            </div>
          </Card>
        </Grid.Col>
      </Grid.Row>
    </section>
  );
}
