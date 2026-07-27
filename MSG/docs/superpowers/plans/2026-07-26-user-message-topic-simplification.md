# User Message Topic Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the detailed App and Web message-center topic filters with the approved compact user-facing topic taxonomy.

**Architecture:** Each standalone HTML prototype keeps its existing rendering and filtering logic. Only `groupConfig` and sample-message topic snapshots change, so primary-category switching, unread counts, topic filtering, and detail views continue using the same code path.

**Tech Stack:** Standalone HTML, CSS, and vanilla JavaScript.

## Global Constraints

- Primary categories remain exactly `公告`, `交易`, `资产`, `安全与风控`, and `活动与奖励`.
- Topic rows include `全部` and no more than four additional choices.
- App and Web use identical topic names and message mappings.
- Existing unread, detail, mark-read, and risk-prompt behavior must remain unchanged.

---

### Task 1: Update the App taxonomy

**Files:**
- Modify: `html/message-center-app.html:574-638`

**Interfaces:**
- Consumes: existing `groupConfig`, `messages`, `selectGroup`, `selectTopic`, and `renderMessages`.
- Produces: compact topic labels consumed by the existing equality-based topic filter.

- [ ] **Step 1: Record a failing static assertion**

Run:

```bash
node -e 'const s=require("fs").readFileSync("html/message-center-app.html","utf8"); if(!s.includes("规则与更新")||s.includes("强平预警\\\", \\\"提现风险")) process.exit(1)'
```

Expected: exit code `1` because the compact labels are not yet present.

- [ ] **Step 2: Replace App topics and sample snapshots**

Use these exact topic arrays:

```js
{ name: "公告", topics: ["全部", "上新", "下架", "维护", "规则与更新"] }
{ name: "交易", topics: ["全部", "订单", "成交", "合约"] }
{ name: "资产", topics: ["全部", "充值", "提现", "其他资产变动"] }
{ name: "安全与风控", topics: ["全部", "账户安全", "风险预警"] }
{ name: "活动与奖励", topics: ["全部", "活动", "奖励到账"] }
```

Map sample messages to `风险预警`, `成交`, `上新`, `奖励到账`, and keep already-valid `充值`, `账户安全`, `活动`, and `下架`.

- [ ] **Step 3: Run the App static assertion**

Run:

```bash
node -e 'const s=require("fs").readFileSync("html/message-center-app.html","utf8"); const required=["规则与更新","其他资产变动","风险预警","奖励到账"]; if(required.some(x=>!s.includes(x))) process.exit(1)'
```

Expected: exit code `0`.

### Task 2: Update the Web taxonomy and verify parity

**Files:**
- Modify: `html/message-center-web.html:271-327`

**Interfaces:**
- Consumes: existing Web `groupConfig`, `messages`, `selectGroup`, `selectTopic`, and `renderMessages`.
- Produces: the same compact topic model as the App prototype.

- [ ] **Step 1: Replace Web topics and sample snapshots**

Apply the exact same arrays and message-topic mapping used in Task 1.

- [ ] **Step 2: Verify both HTML files contain the same taxonomy**

Run:

```bash
node - <<'NODE'
const fs = require("fs");
const files = ["html/message-center-app.html", "html/message-center-web.html"];
const expected = [
  'topics: ["全部", "上新", "下架", "维护", "规则与更新"]',
  'topics: ["全部", "订单", "成交", "合约"]',
  'topics: ["全部", "充值", "提现", "其他资产变动"]',
  'topics: ["全部", "账户安全", "风险预警"]',
  'topics: ["全部", "活动", "奖励到账"]',
];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const fragment of expected) {
    if (!source.includes(fragment)) throw new Error(`${file}: missing ${fragment}`);
  }
}
NODE
```

Expected: exit code `0`.

- [ ] **Step 3: Confirm no retired sample topics remain**

Run:

```bash
node - <<'NODE'
const fs = require("fs");
for (const file of ["html/message-center-app.html", "html/message-center-web.html"]) {
  const source = fs.readFileSync(file, "utf8");
  for (const retired of ['topic: "强平预警"', 'topic: "成交结果"', 'topic: "新币上线"', 'topic: "返佣"']) {
    if (source.includes(retired)) throw new Error(`${file}: retained ${retired}`);
  }
}
NODE
```

Expected: exit code `0`.
