# 交易所消息中心 PRD

> 文档版本：V2.4
>
> 更新日期：2026-07-14
>
> 产品范围：Web / App 用户端站内信 + App Push + 消息运营后台 + 基础数据分析
>
> 当前交付：前端交互原型；产品一期必须正式支持 App Push

## 文档迁移说明

消息中心 PRD 已按业务模块拆分。本文件作为历史路径兼容入口，不再重复保存各模块正文。

完整文档入口：

[ForX Finance 消息中心 PRD 文档集](./docs/prd/message-center/README.md)

## 模块导航

| 编号 | 模块 | 文档 |
|---|---|---|
| 00 | 产品总览 | [消息中心总览](./docs/prd/message-center/00-消息中心总览.md) |
| 01 | 用户端 | [用户消息中心](./docs/prd/message-center/01-用户消息中心.md) |
| 02 | 任务编排 | [人工消息任务](./docs/prd/message-center/02-消息任务.md) |
| 03 | 内容生产 | [消息模板与多语言](./docs/prd/message-center/03-消息模板与多语言.md) |
| 04 | 事件自动化 | [事件目录、通知规则与触发记录](./docs/prd/message-center/04-系统事件.md) |
| 05 | 目标用户 | [用户与受众](./docs/prd/message-center/05-用户与受众.md) |
| 06 | 风险治理 | [审核与发布](./docs/prd/message-center/06-审核与发布.md) |
| 07 | 渠道执行 | [渠道与发送记录](./docs/prd/message-center/07-渠道与发送记录.md) |
| 08 | 效果评估 | [数据分析](./docs/prd/message-center/08-数据分析.md) |
| 09 | 平台治理 | [系统配置与审计](./docs/prd/message-center/09-系统配置与审计.md) |

## 统一边界

- 产品一期正式交付 Web / App 共用的站内信和独立的 App Push；同一站内信消息在两端共用消息 ID、未读数与已读状态。Push 需接入 APNs / FCM、Token 生命周期、通知权限、Deep Link、送达/点击回执和失败治理。
- 当前仓库只实现前端页面、模拟数据和本地交互，不连接真实业务接口、数据库、推送供应商或外部翻译服务。
- 人工消息任务只承载一次性人工发送；事件自动化拆为事件目录、事件通知规则、规则内容版本、触发记录和渠道发送记录。
- 事件规则使用已审核的当前内容版本。内容热切换不停止规则，幂等键固定为`rule_id:event_instance_id`。
- 邮件、短信、自动化旅程、复杂分群和高级营销归因不在产品一期范围。
