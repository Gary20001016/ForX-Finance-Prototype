import {
  Card,
  InputNumber,
  Message,
  Select,
  Space,
  Switch,
  Tag,
} from "@arco-design/web-react";
import { updateLanguageReviewPolicy, usePrototypeStore } from "../../store/prototypeStore";

export default function LanguageReviewPolicyPanel({ canWrite = true }: { canWrite?: boolean }) {
  const store = usePrototypeStore();
  return (
    <Card
      bordered={false}
      className="surface"
      title="语言审核策略"
      extra={<Tag color="arcoblue">策略变更仅影响新建翻译任务</Tag>}
    >
      {!canWrite && (
        <Tag color="orange" style={{ marginBottom: 12 }}>只读 · 当前账号无写权限</Tag>
      )}
      <div className="language-policy-table">
        <div className="language-policy-head">
          <strong>语言</strong><strong>专项审核</strong><strong>授权审核人</strong>
          <strong>SLA</strong><strong>超时动作</strong><strong>状态</strong>
        </div>
        {store.languageReviewPolicies.map((policy) => (
          <div className="language-policy-row" key={policy.localeCode}>
            <div><strong>{policy.localeName}</strong><span>{policy.localeCode}</span></div>
            <Switch
              aria-label={`${policy.localeName}专项审核`}
              checked={policy.specialReviewRequired}
              disabled={!canWrite}
              onChange={(checked) =>
                updateLanguageReviewPolicy(policy.localeCode, {
                  specialReviewRequired: checked,
                })
              }
            />
            <Select
              mode="multiple"
              showSearch
              value={policy.authorizedReviewerIds}
              disabled={!canWrite}
              placeholder="选择可审核该语言的操作者"
              onChange={(authorizedReviewerIds) => {
                if (policy.enabled && authorizedReviewerIds.length === 0) {
                  Message.warning("每个启用语言至少需要 1 名授权审核人");
                  return;
                }
                updateLanguageReviewPolicy(policy.localeCode, {
                  authorizedReviewerIds,
                });
              }}
              options={store.operators
                .filter((operator) => operator.enabled)
                .map((operator) => ({
                  value: operator.id,
                  label: `${operator.name} · ${operator.id} · ${operator.team}`,
                }))}
            />
            <InputNumber
              value={policy.reviewSlaHours}
              disabled={!canWrite}
              min={1}
              suffix="小时"
              onChange={(reviewSlaHours) => updateLanguageReviewPolicy(policy.localeCode, { reviewSlaHours })}
            />
            <Select
              value={policy.timeoutAction}
              disabled={!canWrite}
              onChange={(timeoutAction) => updateLanguageReviewPolicy(policy.localeCode, { timeoutAction })}
              options={["提醒", "升级", "阻断发布"].map((value) => ({ value, label: value }))}
            />
            <Space>
              <Switch
                checked={policy.enabled}
                disabled={!canWrite}
                onChange={(enabled) => {
                  if (enabled && policy.authorizedReviewerIds.length === 0) {
                    Message.warning("请先配置至少 1 名授权审核人");
                    return;
                  }
                  updateLanguageReviewPolicy(policy.localeCode, { enabled });
                }}
              />
              <span>{policy.enabled ? "启用" : "停用"}</span>
            </Space>
          </div>
        ))}
      </div>
    </Card>
  );
}
