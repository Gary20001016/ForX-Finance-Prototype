import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Grid,
  Input,
  Message,
  Modal,
  Space,
  Tag,
} from "@arco-design/web-react";
import type {
  Channel,
  LocalizedMessageContent,
  TemplateTestSendResult,
} from "../../domain/types";
import {
  sendTemplateTest,
  usePrototypeStore,
} from "../../store/prototypeStore";

const CURRENT_OPERATOR_ID = "admin-01";

const sampleValue = (variable: string) => {
  const samples: Record<string, string> = {
    user_nickname: "Test User",
    amount: "128.50",
    currency: "USDT",
    symbol: "BTC/USDT",
    occurred_at: "2026-07-16 12:00:00",
    vip_level: "VIP 5",
    effective_at: "2026-08-01 00:00:00",
  };
  return samples[variable] || `test_${variable}`;
};

export default function TemplateTestSendModal({
  visible,
  content,
  channels,
  variables,
  onClose,
}: {
  visible: boolean;
  content: LocalizedMessageContent;
  channels: Channel[];
  variables: string[];
  onClose: () => void;
}) {
  const store = usePrototypeStore();
  const accounts = store.testAccounts.filter(
    (account) => account.operatorId === CURRENT_OPERATOR_ID,
  );
  const availableChannels = useMemo(
    () =>
      channels.filter(
        (channel) => channel === "站内信" || channel === "Push",
      ),
    [channels],
  );
  const channelKey = availableChannels.join("|");
  const variableKey = variables.join("|");
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {},
  );
  const [result, setResult] = useState<TemplateTestSendResult>();

  useEffect(() => {
    if (!visible) return;
    setSelectedChannels([...availableChannels]);
    setVariableValues(
      Object.fromEntries(variables.map((variable) => [variable, sampleValue(variable)])),
    );
    setResult(undefined);
  }, [visible, channelKey, variableKey]);

  const send = () => {
    try {
      const next = sendTemplateTest({
        operatorId: CURRENT_OPERATOR_ID,
        channels: selectedChannels,
        variables: variableValues,
        content,
      });
      setResult(next);
      Message.success("测试消息已提交到本人测试账号");
    } catch (error) {
      if (error instanceof Error) Message.error(error.message);
    }
  };

  return (
    <Modal
      visible={visible}
      title="模板测试发送"
      onCancel={onClose}
      style={{ width: 820 }}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button
            type="primary"
            disabled={!accounts.length}
            onClick={send}
          >
            发送测试消息
          </Button>
        </Space>
      }
      unmountOnExit
    >
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          title="自动使用本人全部测试账号"
          content="接收账号来自系统配置，当前弹窗不能临时输入、取消选择或添加其他 UID。测试发送不会保存模板，也不会进入正式发送记录。"
        />

        {accounts.length ? (
          <Descriptions
            title={`接收账号 · ${accounts.length} / 4`}
            column={2}
            border
            data={accounts.map((account) => ({
              label: account.remark,
              value: (
                <Space>
                  <span className="mono">{account.uid}</span>
                  <Tag color="green">已校验</Tag>
                </Space>
              ),
            }))}
          />
        ) : (
          <Alert
            type="warning"
            showIcon
            title="尚未配置测试账号"
            content={
              <Space>
                <span>请先在系统配置中维护本人测试 UID。</span>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    onClose();
                    window.location.assign("/settings?tab=test-accounts");
                  }}
                >
                  去配置测试账号
                </Button>
              </Space>
            }
          />
        )}

        <div>
          <strong>测试渠道</strong>
          <div style={{ marginTop: 10 }}>
            <Checkbox.Group
              value={selectedChannels}
              options={availableChannels}
              onChange={(values) => setSelectedChannels(values as Channel[])}
            />
          </div>
        </div>

        <div>
          <strong>模板变量样例</strong>
          {variables.length ? (
            <Grid.Row gutter={12} style={{ marginTop: 10 }}>
              {variables.map((variable) => (
                <Grid.Col span={12} key={variable}>
                  <label>
                    <span className="mono">{`{{ ${variable} }}`}</span>
                    <Input
                      aria-label={`变量 ${variable}`}
                      value={variableValues[variable] || ""}
                      onChange={(value) =>
                        setVariableValues((current) => ({
                          ...current,
                          [variable]: value,
                        }))
                      }
                    />
                  </label>
                </Grid.Col>
              ))}
            </Grid.Row>
          ) : (
            <div className="muted" style={{ marginTop: 8 }}>
              当前模板没有变量
            </div>
          )}
        </div>

        {result && (
          <Alert
            type="success"
            showIcon
            title="测试发送已完成"
            content={`${result.accountCount} 个测试账号 × ${result.channelCount} 个渠道，共生成 ${result.totalDeliveries} 条测试发送`}
          />
        )}
      </Space>
    </Modal>
  );
}
