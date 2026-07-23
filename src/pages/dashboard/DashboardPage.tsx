import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Grid,
  Select,
  Space,
  Table,
  Tag,
} from "@arco-design/web-react";
import {
  IconCheckCircle,
  IconClockCircle,
  IconExclamationCircle,
  IconNotification,
  IconSend,
} from "@arco-design/web-react/icon";
import PageHeader from "../../components/PageHeader";
import MetricCard from "../../components/MetricCard";
import StatusTag from "../../components/StatusTag";
import { usePrototypeStore } from "../../store/prototypeStore";
import { openPrototypeDialog } from "../../utils/prototypeActions";

const { Row, Col } = Grid;

type Range = "今日" | "近7天" | "近30天";

const summaryByRange: Record<
  Range,
  { sent: string; deliveryRate: string; readRate: string; failed: number }
> = {
  今日: {
    sent: "12.84M",
    deliveryRate: "99.42",
    readRate: "34.26",
    failed: 326,
  },
  近7天: {
    sent: "87.56M",
    deliveryRate: "99.38",
    readRate: "33.91",
    failed: 2148,
  },
  近30天: {
    sent: "351.20M",
    deliveryRate: "99.31",
    readRate: "32.84",
    failed: 9326,
  },
};

const trendDays = [
  { label: "07/07", sent: 58, delivered: 56 },
  { label: "07/08", sent: 72, delivered: 70 },
  { label: "07/09", sent: 66, delivered: 64 },
  { label: "07/10", sent: 84, delivered: 82 },
  { label: "07/11", sent: 75, delivered: 73 },
  { label: "07/12", sent: 92, delivered: 89 },
  { label: "07/13", sent: 88, delivered: 86 },
];

const actionItems = [
  {
    id: "ACTION-01",
    issue: "Push 永久失败上升",
    task: "提现安全通知",
    impact: "286 个设备",
    status: "需处理",
    action: "查看发送记录",
  },
  {
    id: "ACTION-02",
    issue: "风险消息超时未读",
    task: "合约强平风险预警",
    impact: "286 个用户",
    status: "关键",
    action: "查看未读用户",
  },
  {
    id: "ACTION-03",
    issue: "审核任务积压",
    task: "夏季交易赛召回",
    impact: "12 个工单",
    status: "待审核",
    action: "查看审核任务",
  },
];

export default function DashboardPage() {
  const store = usePrototypeStore();
  const [range, setRange] = useState<Range>("今日");
  const summary = summaryByRange[range];
  const pendingApprovals = useMemo(
    () =>
      store.approvals.filter((item) =>
        ["待审核", "待我审核", "紧急"].includes(item.status),
      ).length,
    [store.approvals],
  );

  const metrics = [
    {
      title: "发送量",
      value: summary.sent,
      change: "8.2%",
      icon: <IconSend />,
    },
    {
      title: "送达率",
      value: summary.deliveryRate,
      suffix: "%",
      change: "0.18%",
      icon: <IconCheckCircle />,
    },
    {
      title: "阅读率",
      value: summary.readRate,
      suffix: "%",
      change: "2.1%",
      icon: <IconCheckCircle />,
    },
    {
      title: "发送失败",
      value: summary.failed,
      change: "4.6%",
      positive: false,
      icon: <IconExclamationCircle />,
    },
    {
      title: "待审核",
      value: pendingApprovals,
      change: "3 项新增",
      positive: false,
      icon: <IconClockCircle />,
    },
    {
      title: "风险超时未读",
      value: 286,
      change: "12.4%",
      icon: <IconNotification />,
    },
  ];

  return (
    <section className="page-stack">
      <PageHeader
        title="消息运营工作台"
        description="集中查看消息效果、审核待办和需要处理的发送异常。"
        actions={
          <Space>
            <Select
              aria-label="统计时间"
              value={range}
              onChange={setRange}
              style={{ width: 120 }}
              options={(["今日", "近7天", "近30天"] as Range[]).map(
                (value) => ({ label: value, value }),
              )}
            />
            <Tag>更新于 18:06 · UTC+8</Tag>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={metric.title}>
            <MetricCard {...metric} />
          </Col>
        ))}
      </Row>

      <div className="dashboard-main-grid">
        <Card
          className="surface dashboard-trend-card"
          title="发送与送达趋势"
          extra={
            <Space>
              <span className="dashboard-trend-legend sent">发送量</span>
              <span className="dashboard-trend-legend delivered">送达量</span>
            </Space>
          }
          bordered={false}
        >
          <div
            className="dashboard-trend"
            role="img"
            aria-label="近 7 日发送量与送达量趋势"
          >
            {trendDays.map((day) => (
              <div className="dashboard-trend-group" key={day.label}>
                <div className="dashboard-trend-bars">
                  <i
                    className="dashboard-trend-bar sent"
                    style={{ height: `${day.sent}%` }}
                  />
                  <i
                    className="dashboard-trend-bar delivered"
                    style={{ height: `${day.delivered}%` }}
                  />
                </div>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="surface dashboard-actions-card"
          title="需要处理"
          extra={<Tag color="red">3 项</Tag>}
          bordered={false}
        >
          <Table
            pagination={false}
            rowKey="id"
            data={actionItems}
            columns={[
              { title: "问题", dataIndex: "issue", width: 160 },
              { title: "关联任务", dataIndex: "task", width: 150 },
              { title: "影响", dataIndex: "impact", width: 110 },
              {
                title: "状态",
                dataIndex: "status",
                width: 90,
                render: (status) => <StatusTag status={status} />,
              },
              {
                title: "操作",
                width: 120,
                render: (_, item) => (
                  <Button
                    type="text"
                    onClick={() =>
                      openPrototypeDialog(
                        item.action,
                        `${item.task}：${item.issue}，当前影响 ${item.impact}。`,
                      )
                    }
                  >
                    {item.action}
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </section>
  );
}
