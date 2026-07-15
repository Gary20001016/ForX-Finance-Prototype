import { Card, InputNumber, Select, Space, Switch, Tag } from "@arco-design/web-react";
import { updateLanguageReviewPolicy, usePrototypeStore } from "../../store/prototypeStore";

export default function LanguageReviewPolicyPanel() {
  const store = usePrototypeStore();
  return (
    <Card
      bordered={false}
      className="surface"
      title="语言审核策略"
      extra={<Tag color="arcoblue">策略变更仅影响新建翻译任务</Tag>}
    >
      <div className="language-policy-table">
        <div className="language-policy-head">
          <strong>语言</strong><strong>专项审核</strong><strong>审核组</strong>
          <strong>审核人数</strong><strong>允许提交人自审</strong><strong>SLA</strong>
          <strong>超时动作</strong><strong>状态</strong>
        </div>
        {store.languageReviewPolicies.map((policy) => (
          <div className="language-policy-row" key={policy.localeCode}>
            <div><strong>{policy.localeName}</strong><span>{policy.localeCode}</span></div>
            <Switch
              aria-label={`${policy.localeName}专项审核`}
              checked={policy.specialReviewRequired}
              onChange={(checked) =>
                updateLanguageReviewPolicy(policy.localeCode, {
                  specialReviewRequired: checked,
                  reviewGroup: checked ? policy.reviewGroup || `${policy.localeName}专项审核组` : undefined,
                })
              }
            />
            <Select
              value={policy.reviewGroup}
              disabled={!policy.specialReviewRequired}
              onChange={(reviewGroup) => updateLanguageReviewPolicy(policy.localeCode, { reviewGroup })}
              options={["日韩专项审核组", "小语种专项审核组", "欧洲语言审核组"].map((value) => ({ value, label: value }))}
            />
            <Select
              value={policy.reviewerCount}
              disabled={!policy.specialReviewRequired}
              onChange={(reviewerCount) => updateLanguageReviewPolicy(policy.localeCode, { reviewerCount })}
              options={[1, 2].map((value) => ({ value, label: `${value} 人` }))}
            />
            <Switch
              checked={policy.allowSubmitterReview}
              onChange={(allowSubmitterReview) => updateLanguageReviewPolicy(policy.localeCode, { allowSubmitterReview })}
            />
            <InputNumber
              value={policy.reviewSlaHours}
              min={1}
              suffix="小时"
              onChange={(reviewSlaHours) => updateLanguageReviewPolicy(policy.localeCode, { reviewSlaHours })}
            />
            <Select
              value={policy.timeoutAction}
              onChange={(timeoutAction) => updateLanguageReviewPolicy(policy.localeCode, { timeoutAction })}
              options={["提醒", "升级", "阻断发布"].map((value) => ({ value, label: value }))}
            />
            <Space><Switch checked={policy.enabled} onChange={(enabled) => updateLanguageReviewPolicy(policy.localeCode, { enabled })}/><span>{policy.enabled ? "启用" : "停用"}</span></Space>
          </div>
        ))}
      </div>
    </Card>
  );
}
