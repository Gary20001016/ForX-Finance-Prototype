# User Message Topic Simplification Design

## Goal

Simplify the App and Web message-center prototypes so users never see the full backend event taxonomy. The user-facing information architecture keeps five primary categories and shows only the compact topics that belong to the selected primary category.

## Scope

- `html/message-center-app.html`
- `html/message-center-web.html`

The React administration console is outside this change. Backend systems may continue retaining precise event types for routing and audit purposes.

## User-facing taxonomy

| Primary category | Visible topics |
| --- | --- |
| 公告 | 上新、下架、维护、规则与更新 |
| 交易 | 订单、成交、合约 |
| 资产 | 充值、提现、其他资产变动 |
| 安全与风控 | 账户安全、风险预警 |
| 活动与奖励 | 活动、奖励到账 |

Every topic row also contains `全部`.

## Mapping

- `维护升级` → `维护`
- `新币上线` → `上新`
- `规则调整` and `产品更新` → `规则与更新`
- `订单更新` → `订单`
- `成交结果` and `订单成交` → `成交`
- `合约通知` → `合约`
- `划转` and `资产变动` → `其他资产变动`
- `异常登录`, `设备变化`, and `账户安全` → `账户安全`
- `强平预警`, `提现风险`, and `账户异常` → `风险预警`
- `体验金`, `积分`, `返佣`, and other rewards → `奖励到账`

## Interaction

Changing the primary category resets the selected topic to `全部`. Only topics under the active primary category are rendered. The `全部` primary category does not expose a mixed topic row beyond `全部`.

## Data behavior

The prototypes store the compact user-facing topic on every sample message. Precise backend event semantics remain represented by message title and content, not by additional user-facing filters.

## Acceptance criteria

- App and Web expose the same five primary categories.
- No active topic row contains more than five items including `全部`.
- Existing sample messages remain discoverable under the new compact topic mapping.
- Selecting a topic filters the list correctly.
- Existing unread, detail, mark-read, and risk-prompt interactions continue to work.
