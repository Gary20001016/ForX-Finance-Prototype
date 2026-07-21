import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Form,
  Input,
  Message,
  Radio,
  Space,
  Tabs,
  Tag,
  Timeline,
} from "@arco-design/web-react";
import type { ApprovalItem } from "../../domain/types";
import StatusTag from "../../components/StatusTag";
import MessagePreview from "../../components/MessagePreview";
import { reviewApproval } from "../../store/prototypeStore";
import WritePermissionButton from "../../components/WritePermissionButton";

export default function ApprovalDrawer({
  item,
  visible,
  onClose,
  currentAdminId,
  canWrite = true,
}: {
  item?: ApprovalItem;
  visible: boolean;
  onClose: () => void;
  currentAdminId: string;
  canWrite?: boolean;
}) {
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [opinion, setOpinion] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const isSelf = item?.submitterId === currentAdminId;
  const highRisk = item?.risk === "高" || item?.risk === "关键";
  useEffect(() => {
    setDecision("approve");
    setOpinion("");
    setConfirmed(false);
  }, [item]);
  const submit = (next: "approve" | "reject") => {
    if (!canWrite) {
      Message.warning("当前账号无写权限");
      return;
    }
    setDecision(next);
    if (!item) return;
    if (isSelf) {
      Message.warning("不可审核本人创建的任务");
      return;
    }
    if (next === "reject" && !opinion.trim()) {
      Message.warning("请填写驳回原因");
      return;
    }
    if (next === "approve" && highRisk && !confirmed) {
      Message.warning("高风险审批必须确认已核对全部关键配置");
      return;
    }
    reviewApproval(item.id, {
      decision: next,
      reviewer: "Gary Ma",
      opinion: opinion || "已核对内容、受众、渠道、时间与有效期",
    });
    Message.success(
      next === "approve"
        ? item.triggerType === "event"
          ? "审批已通过，事件任务已启用"
          : item.schedule === "立即"
            ? "审核已通过，任务开始发送"
            : "审核已通过，任务进入待发送状态"
        : "审核已驳回，任务进入待修改状态",
    );
    onClose();
  };
  return (
    <Drawer
      width={980}
      visible={visible}
      title={item ? `审批 · ${item.name}` : "审批详情"}
      onCancel={onClose}
      footer={
        item && (
          <div className="drawer-footer">
            <Button onClick={onClose}>取消</Button>
            <WritePermissionButton
              status="danger"
              allowed={canWrite}
              disabled={isSelf}
              onClick={() => submit("reject")}
            >
              驳回审核
            </WritePermissionButton>
            <WritePermissionButton
              type="primary"
              allowed={canWrite}
              disabled={isSelf}
              onClick={() => submit("approve")}
            >
              通过审核
            </WritePermissionButton>
          </div>
        )
      }
    >
      {item && (
        <div className="approval-drawer">
          {isSelf && (
            <Alert
              type="warning"
              showIcon
              title="职责分离限制"
              content="不可审核本人创建的任务，请转交其他同级审核人。"
            />
          )}
          <Descriptions
            column={3}
            border
            data={[
              { label: "审批单", value: item.id },
              {
                label: "风险等级",
                value: (
                  <Tag color={item.risk === "关键" ? "red" : "orange"}>
                    {item.risk}
                  </Tag>
                ),
              },
              { label: "对象类型", value: item.objectType },
              {
                label: "触发方式",
                value:
                  item.triggerType === "event" ? "系统事件触发" : "人工发送",
              },
              { label: "当前节点", value: item.step },
              { label: "预计受众", value: item.audience.toLocaleString() },
              { label: "预计成本", value: item.cost },
              { label: "计划时间", value: item.schedule },
              { label: "有效期", value: item.expiresAt || "未设置" },
              { label: "状态", value: <StatusTag status={item.status} /> },
            ]}
          />
          {item.eventConfig && (
            <>
              <Alert
                style={{ marginTop: 16 }}
                type="info"
                title="冻结的事件触发策略"
                content="审批通过后任务进入已启用状态；事件、模板版本、映射、去重和重试策略均按本审批快照执行。"
              />
              <Descriptions
                column={2}
                border
                data={[
                  {
                    label: "事件编码 / 版本",
                    value: `${item.eventConfig.eventId} · ${item.eventConfig.eventVersion}`,
                  },
                  { label: "模板版本", value: item.templateVersion || "—" },
                  {
                    label: "触发条件",
                    value:
                      item.eventConfig.conditionExpression || "事件到达即触发",
                  },
                  { label: "去重键", value: item.eventConfig.dedupeKey },
                  {
                    label: "事件有效期",
                    value: `${item.eventConfig.eventTtlSeconds} 秒`,
                  },
                  {
                    label: "重试策略",
                    value: `最多 ${item.eventConfig.maxRetries} 次 · 首次退避 ${item.eventConfig.retryBackoffSeconds} 秒`,
                  },
                  {
                    label: "变量映射",
                    value: item.eventConfig.variableMappings
                      .map(
                        (mapping) =>
                          `${mapping.eventField} → ${mapping.templateVariable}`,
                      )
                      .join("；"),
                  },
                ]}
              />
            </>
          )}
          <Tabs defaultActiveTab="preview">
            <Tabs.TabPane key="preview" title="内容预览">
              {item.content ? (
                <MessagePreview
                  content={item.content}
                  showPushPriority={item.triggerType === "event"}
                />
              ) : (
                <Alert
                  type="warning"
                  content="该历史审批对象没有冻结内容快照"
                />
              )}
            </Tabs.TabPane>
            <Tabs.TabPane key="diff" title="版本差异">
              <div className="diff-panel">
                <div>
                  <span>当前审批版本</span>
                  <strong>{item.content?.web.title || item.name}</strong>
                  <p>{item.content?.web.summary}</p>
                </div>
                <div className="diff-added">
                  {(item.changes || ["首次提交审核"]).map((change) => (
                    <div key={change}>+ {change}</div>
                  ))}
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane key="audience" title="受众与合规">
              <Alert
                type="success"
                content={`${item.audience.toLocaleString()} 名用户已通过地区、授权、退订、频控和地址有效性检查。`}
              />
            </Tabs.TabPane>
            <Tabs.TabPane key="audit" title="审批轨迹">
              <Timeline>
                <Timeline.Item>
                  {item.submittedAt} {item.submitter} 提交审批
                </Timeline.Item>
                <Timeline.Item>内容、变量、链接与受众扫描通过</Timeline.Item>
                {item.reviewedAt && (
                  <Timeline.Item>
                    {item.reviewedAt} {item.reviewer} · {item.status}
                  </Timeline.Item>
                )}
                <Timeline.Item>等待当前审核人处理</Timeline.Item>
              </Timeline>
            </Tabs.TabPane>
          </Tabs>
          <Form layout="vertical">
            <Form.Item label="审批结论">
              <Radio.Group value={decision} disabled={!canWrite} onChange={setDecision}>
                <Radio value="approve">通过审核</Radio>
                <Radio value="reject">驳回审核</Radio>
              </Radio.Group>
            </Form.Item>
            {highRisk && (
              <Form.Item>
                <Checkbox checked={confirmed} disabled={!canWrite} onChange={setConfirmed}>
                  我已核对目标范围、最终 Web/Push
                  内容、发送时间、有效期和失败策略
                </Checkbox>
              </Form.Item>
            )}
            <Form.Item label="审批意见" required={decision === "reject"}>
              <Input.TextArea
                value={opinion}
                disabled={!canWrite}
                onChange={setOpinion}
                placeholder={
                  decision === "reject"
                    ? "请填写驳回原因"
                    : "填写风险判断和补充意见"
                }
              />
            </Form.Item>
          </Form>
        </div>
      )}
    </Drawer>
  );
}
