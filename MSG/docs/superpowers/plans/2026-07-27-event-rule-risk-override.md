# Event Rule Risk Override Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 允许条件触发的事件通知规则在不降低模板风险的前提下覆盖风险，并让规则展示与审核统一使用最终生效风险。

**Architecture:** 在风险领域工具中提供统一的等级比较与最终风险计算函数；`EventNotificationRule` 保存可选 `riskOverride`，现有 `risk` 保存最终值。规则表单负责展示和清理覆盖选项，Store 负责最终校验、计算和审批风险传递。

**Tech Stack:** React 18、TypeScript、Arco Design React、Zustand、Vitest、Testing Library

## Global Constraints

- 风险顺序固定为：低 < 中 < 高 < 关键。
- 只有条件触发可以配置风险覆盖。
- 风险覆盖不能低于模板风险。
- `riskOverride` 保存覆盖来源，`risk` 保存最终生效风险。
- 规则列表、详情和审批继续读取最终 `risk`。
- 不改变事件消息模板的风险继承逻辑。

---

### Task 1: 风险等级计算与规则数据约束

**Files:**

- Modify: `src/domain/types.ts`
- Modify: `src/domain/messageDisplayTaxonomy.ts`
- Test: `src/domain/messageDisplayTaxonomy.test.ts`
- Modify: `src/store/prototypeStore.ts`
- Test: `src/store/prototypeStore.test.ts`

**Interfaces:**

- Produces: `getEffectiveRiskLevel(templateRisk, riskOverride)`，返回不低于模板风险的最终风险。
- Produces: `getRiskLevelsAtOrAbove(templateRisk)`，返回表单允许选择的覆盖等级。
- Produces: `EventNotificationRule.riskOverride?: RiskLevel`。

- [x] **Step 1: 编写风险计算和 Store 失败测试**

```ts
expect(getEffectiveRiskLevel("中", "高")).toBe("高");
expect(getEffectiveRiskLevel("高", "中")).toBe("高");
expect(getRiskLevelsAtOrAbove("中")).toEqual(["中", "高", "关键"]);
```

创建规则时验证：

```ts
expect(() =>
  createEventRule({
    conditionExpression: "amount >= 1000",
    riskOverride: "低",
    // 其余为充值模板字段，模板风险为中
  }),
).toThrow("条件风险不能低于模板风险");
```

- [x] **Step 2: 运行测试并确认失败**

Run:

```bash
npx vitest run src/domain/messageDisplayTaxonomy.test.ts src/store/prototypeStore.test.ts
```

Expected: FAIL，风险计算函数和覆盖字段尚不存在。

- [x] **Step 3: 实现风险比较工具**

```ts
export const getRiskLevelsAtOrAbove = (risk: RiskLevel): RiskLevel[] => {
  const index = MESSAGE_RISK_LEVELS.indexOf(risk);
  return MESSAGE_RISK_LEVELS.slice(Math.max(index, 0));
};

export const getEffectiveRiskLevel = (
  templateRisk: RiskLevel,
  riskOverride?: RiskLevel,
): RiskLevel => {
  if (!riskOverride) return templateRisk;
  return MESSAGE_RISK_LEVELS.indexOf(riskOverride) >
    MESSAGE_RISK_LEVELS.indexOf(templateRisk)
    ? riskOverride
    : templateRisk;
};
```

- [x] **Step 4: 扩展规则数据与 Store 输入**

```ts
export interface EventNotificationRule {
  risk: RiskLevel;
  riskOverride?: RiskLevel;
}
```

`EventRuleDraftInput` 增加 `riskOverride?: RiskLevel`。创建和更新时：

```ts
if (
  input.riskOverride &&
  !getRiskLevelsAtOrAbove(template.risk).includes(input.riskOverride)
) {
  throw new Error("条件风险不能低于模板风险");
}
if (
  input.conditionExpression === "事件到达即触发" &&
  input.riskOverride
) {
  throw new Error("事件触发不能设置风险覆盖");
}
const riskOverride = input.riskOverride;
const risk = getEffectiveRiskLevel(template.risk, riskOverride);
```

- [x] **Step 5: 修正规则迁移和审批风险**

规则迁移使用模板风险和已保存覆盖值重新计算最终风险。提交审核时使用：

```ts
const finalRisk = getEffectiveRiskLevel(template.risk, rule.riskOverride);
```

审批单的 `risk`、审核步骤和紧急判断全部基于 `finalRisk`。

- [x] **Step 6: 运行领域和 Store 测试**

Run:

```bash
npx vitest run src/domain/messageDisplayTaxonomy.test.ts src/store/prototypeStore.test.ts
```

Expected: PASS。

---

### Task 2: 规则表单风险覆盖交互

**Files:**

- Modify: `src/pages/automation/AutomationRuleListPage.tsx`
- Test: `src/pages/automation/AutomationRuleListPage.test.tsx`

**Interfaces:**

- Consumes: `getEffectiveRiskLevel()`。
- Consumes: `getRiskLevelsAtOrAbove()`。
- Produces: 规则表单字段 `riskOverride`。

- [x] **Step 1: 编写表单失败测试**

覆盖以下行为：

```text
选择条件触发和中风险模板
显示条件风险覆盖
选项只有不覆盖、中、高、关键
选择高后保存
规则 riskOverride 为高，risk 为高
切回事件触发后 riskOverride 被清空
```

- [x] **Step 2: 运行页面测试并确认失败**

Run:

```bash
npx vitest run src/pages/automation/AutomationRuleListPage.test.tsx
```

Expected: FAIL，当前规则表单没有风险覆盖字段。

- [x] **Step 3: 增加覆盖状态和表单字段**

```ts
const [riskOverride, setRiskOverride] = useState<RiskLevel>();
const effectiveRisk = formTemplate
  ? getEffectiveRiskLevel(formTemplate.risk, riskOverride)
  : undefined;
```

仅条件触发且已选择模板时显示：

```tsx
<Form.Item label="条件风险覆盖" field="riskOverride">
  <Select
    allowClear
    placeholder="不覆盖，继承模板风险"
    options={getRiskLevelsAtOrAbove(formTemplate.risk).map((value) => ({
      label: value,
      value,
    }))}
  />
</Form.Item>
```

- [x] **Step 4: 清理无效覆盖并保存**

切换事件触发、切换事件或切换模板时清空 `riskOverride`。保存输入增加：

```ts
riskOverride:
  values.triggerMode === "condition" ? values.riskOverride : undefined,
```

- [x] **Step 5: 展示模板风险与最终风险**

继承信息区域展示：

```text
模板风险
条件覆盖
最终生效风险
```

规则详情在存在覆盖时显示“条件触发覆盖：高”。

- [x] **Step 6: 运行规则页面测试**

Run:

```bash
npx vitest run src/pages/automation/AutomationRuleListPage.test.tsx
```

Expected: PASS。

---

### Task 3: 审核传递与完整验证

**Files:**

- Modify: `src/pages/approvals/ApprovalCenter.completion.test.tsx`
- Verify: `src/**`

**Interfaces:**

- Consumes: `EventNotificationRule.risk` 最终风险。
- Consumes: `EventNotificationRule.riskOverride` 覆盖来源。

- [x] **Step 1: 编写审批失败测试**

创建中风险模板的条件规则并覆盖为高，提交审核后断言：

```ts
expect(approval.risk).toBe("高");
expect(approval.step).toBe("业务 + 风控双审");
```

- [x] **Step 2: 运行审批测试并确认失败**

Run:

```bash
npx vitest run src/pages/approvals/ApprovalCenter.completion.test.tsx
```

Expected: FAIL，审批仍使用模板风险。

- [x] **Step 3: 完成审批风险传递并运行关联测试**

Run:

```bash
npx vitest run \
  src/domain/messageDisplayTaxonomy.test.ts \
  src/store/prototypeStore.test.ts \
  src/pages/automation/AutomationRuleListPage.test.tsx \
  src/pages/approvals/ApprovalCenter.completion.test.tsx
```

Expected: PASS。

- [x] **Step 4: 运行完整测试和生产构建**

Run:

```bash
npm test -- --run
npm run build
git diff --check
```

Expected: 全部通过，无 TypeScript 或差异格式错误。

- [x] **Step 5: 更新本计划复选框并总结**

保留当前分支，不自动推送或部署，等待用户明确指令。
