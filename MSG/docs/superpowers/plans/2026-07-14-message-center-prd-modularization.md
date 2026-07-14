# Message Center PRD Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 829-line message-center PRD with a navigable product overview and nine independently reviewable module PRDs without losing confirmed requirements.

**Architecture:** Store the authoritative modular documentation in `docs/prd/message-center/`. Keep the root PRD as a compatibility entrypoint, make the overview own cross-module product context, and make each module document own its detailed fields, states, rules, exceptions, and acceptance criteria.

**Tech Stack:** Markdown, Mermaid, shell-based link and coverage checks, Git.

## Global Constraints

- Treat `PRD-exchange-message-center-admin.md` V2.1 as the source of truth for existing requirements.
- Do not add new product scope during the split.
- App Push is a first-phase required channel, not a reserved future capability.
- System events connect to published template versions through enabled event-triggered tasks; an event definition does not directly bind a template.
- Preserve seven message categories, five manual audience types, eight system-event scenarios, external machine translation, human review, risk strong prompts, validity periods, retention, and basic analytics.
- Keep the current delivery boundary explicit: this repository implements a frontend interaction prototype; production APIs and providers are later engineering work.
- Avoid duplicate authoritative definitions; use relative links for cross-module rules.

---

### Task 1: Establish the PRD directory and navigation contract

**Files:**
- Create: `docs/prd/message-center/README.md`
- Create: `docs/prd/message-center/00-消息中心总览.md`

**Interfaces:**
- Consumes: confirmed file map in `docs/superpowers/specs/2026-07-14-message-center-prd-modularization-design.md`.
- Produces: stable relative links and common terminology used by all module documents.

- [ ] **Step 1: Create the directory index**

Create `README.md` with links to the overview and all nine module files, the recommended reading order, document ownership rules, and version information.

- [ ] **Step 2: Create the product overview**

Move the summary, contacts, background, objectives, user groups, value proposition, product boundaries, information architecture, cross-module flow, release plan, assumptions, and risks into `00-消息中心总览.md`.

- [ ] **Step 3: Verify navigation entries**

Run:

```bash
rg -n '^\| 0[0-9] ' docs/prd/message-center/README.md
```

Expected: ten rows covering `00` through `09`.

- [ ] **Step 4: Verify overview scope**

Run:

```bash
rg -n 'Web 站内信|App Push|跨模块|前端交互原型|产品一期' docs/prd/message-center/00-消息中心总览.md
```

Expected: all five concepts are present.

---

### Task 2: Extract user experience, task, and content-production modules

**Files:**
- Create: `docs/prd/message-center/01-用户消息中心.md`
- Create: `docs/prd/message-center/02-消息任务.md`
- Create: `docs/prd/message-center/03-消息模板与多语言.md`

**Interfaces:**
- Consumes: source PRD sections 7.1.1, 7.1.3 modules 1-3, 7.2.1-7.2.7, 7.3-7.5, and the external-translation design.
- Produces: user-message rules, task lifecycle, and template release gates referenced by later modules.

- [ ] **Step 1: Write the user message-center PRD**

Include the seven categories; title, summary, category, time, read state; single/all read; detail; Deep Link; risk strong prompts; user-message fields and state; error cases; and acceptance scenarios.

- [ ] **Step 2: Write the message-task PRD**

Define manual and event trigger types, draft/edit/copy rules, task fields, schedule and validity strategy, the rule that sending and completed tasks cannot be edited, the task state machine, and task-level acceptance criteria.

- [ ] **Step 3: Write the template and multilingual PRD**

Define template/version fields, variables, preview, source locale, selected target locales, external asynchronous translation task, callback and polling fallback, per-language human review, all-languages-approved publishing gate, and error recovery.

- [ ] **Step 4: Verify required content**

Run:

```bash
rg -n '系统公告|交易通知|资产通知|安全通知|奖励通知|活动通知|风控通知' docs/prd/message-center/01-用户消息中心.md
rg -n '人工发送|系统事件触发|发送中|已完成|不可编辑' docs/prd/message-center/02-消息任务.md
rg -n 'external_task_id|回调|主动查询|人工审核|全部.*审核通过|模板版本' docs/prd/message-center/03-消息模板与多语言.md
```

Expected: each command returns all concepts listed in its pattern.

---

### Task 3: Extract event, audience, and approval modules

**Files:**
- Create: `docs/prd/message-center/04-系统事件.md`
- Create: `docs/prd/message-center/05-用户与受众.md`
- Create: `docs/prd/message-center/06-审核与发布.md`

**Interfaces:**
- Consumes: task and template contracts from Task 2 plus source PRD sections 7.1.3 modules 4 and 6, 7.2.5-7.2.6, 7.2.10-7.2.11, and the event-task-template integration design.
- Produces: event runtime rules, audience snapshots, and immutable approval versions used by delivery.

- [ ] **Step 1: Write the system-event PRD**

Define event registration, event code, variables, eight required scenarios, enabled event-triggered tasks, template-version eligibility, variable mapping, trigger conditions, deduplication, TTL, retries, test events, and failure cases.

- [ ] **Step 2: Write the users-and-audience PRD**

Define all-site, specified UID, VIP, agent, and activity-participant audiences; inclusion/exclusion rules; estimate; event-subject audiences; immutable snapshots; permission and masking requirements; and validation errors.

- [ ] **Step 3: Write the approval-and-release PRD**

Define risk levels, ordinary/important/emergency approval routes, frozen versions, translation and template gates, approve/reject/withdraw behavior, permissions, audit events, and acceptance cases.

- [ ] **Step 4: Verify required content**

Run:

```bash
rg -n '充值到账|提现成功|提现失败|订单成交|强平预警|体验金到账|积分到账|返佣到账' docs/prd/message-center/04-系统事件.md
rg -n '全站|指定用户|指定 VIP|指定代理|活动参与用户|受众快照' docs/prd/message-center/05-用户与受众.md
rg -n '普通|重要|紧急|冻结|驳回|撤回|发布门禁' docs/prd/message-center/06-审核与发布.md
```

Expected: all required event, audience, and approval terms are present.

---

### Task 4: Extract delivery, analytics, and governance modules

**Files:**
- Create: `docs/prd/message-center/07-渠道与发送记录.md`
- Create: `docs/prd/message-center/08-数据分析.md`
- Create: `docs/prd/message-center/09-系统配置与审计.md`

**Interfaces:**
- Consumes: approved immutable task versions and audience snapshots from Tasks 2-3.
- Produces: channel delivery records, measurement definitions, and global governance rules.

- [ ] **Step 1: Write the channels-and-deliveries PRD**

Define Web inbox and required App Push behavior, APNs/FCM integration responsibilities, Token lifecycle, notification permissions, Deep Link, delivery/click receipts, retries, invalid-Token cleanup, expiry, delivery fields, statuses, and error handling.

- [ ] **Step 2: Write the analytics PRD**

Define generation, delivery, read, click, failure, and expiry metrics; formulas; first-phase reports; filters; event tracking; attribution boundary; data latency; and acceptance criteria.

- [ ] **Step 3: Write the system-configuration-and-audit PRD**

Define category configuration, Deep Link allowlist, default validity and retention, roles and permissions, sensitive-data masking, operation logs, configuration-change audit, and governance acceptance criteria.

- [ ] **Step 4: Verify required content**

Run:

```bash
rg -n 'APNs|FCM|Token|Deep Link|送达|点击|重试|失效' docs/prd/message-center/07-渠道与发送记录.md
rg -n '生成量|送达率|阅读率|点击率|失败率|过期率|埋点' docs/prd/message-center/08-数据分析.md
rg -n '分类配置|白名单|有效期|保留时间|权限|脱敏|操作日志' docs/prd/message-center/09-系统配置与审计.md
```

Expected: all required delivery, analytics, and governance terms are present.

---

### Task 5: Replace the legacy PRD and run coverage validation

**Files:**
- Modify: `PRD-exchange-message-center-admin.md`
- Modify: `docs/prd/message-center/README.md`

**Interfaces:**
- Consumes: all documents created by Tasks 1-4.
- Produces: one compatibility entrypoint and a fully navigable modular PRD set.

- [ ] **Step 1: Replace the root PRD with a compatibility index**

Keep the title, current version, scope, delivery boundary, migration note, and a link to `docs/prd/message-center/README.md`. Remove the duplicated 829-line body.

- [ ] **Step 2: Check local Markdown links**

Run a shell loop that extracts Markdown link targets from all module documents, ignores external URLs and anchors, resolves each target relative to its source file, and exits non-zero if any target is missing.

Expected: `All local Markdown links exist`.

- [ ] **Step 3: Check placeholders and terminology**

Run:

```bash
if rg -n 'TBD|TODO|待补充|后续确认|App Push.*预留' PRD-exchange-message-center-admin.md docs/prd/message-center; then exit 1; else echo 'No placeholders or deprecated Push wording'; fi
```

Expected: `No placeholders or deprecated Push wording`.

- [ ] **Step 4: Check module count and headings**

Run:

```bash
test "$(find docs/prd/message-center -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')" = "11"
for file in docs/prd/message-center/0[1-9]-*.md; do rg -q '^## 12\. 验收标准' "$file" || exit 1; done
echo 'Module count and acceptance headings valid'
```

Expected: `Module count and acceptance headings valid`.

- [ ] **Step 5: Check Git diff hygiene**

Run:

```bash
git diff --check -- PRD-exchange-message-center-admin.md docs/prd/message-center
```

Expected: exit code 0 with no output.

- [ ] **Step 6: Review changed-document scope**

Run:

```bash
git status --short PRD-exchange-message-center-admin.md docs/prd/message-center
```

Expected: one modified root PRD and eleven new Markdown files under `docs/prd/message-center/`.
