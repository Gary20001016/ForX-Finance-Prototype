import { render, screen } from '@testing-library/react';
import type {
  MessageTemplate,
  SystemEventDefinition,
} from '../../domain/types';
import TemplateReadOnlyDetails from './TemplateReadOnlyDetails';

const template: MessageTemplate = {
  id: 'TPL-TEST',
  code: 'test_template',
  name: '测试模板',
  category: 'announcement',
  topic: 'maintenance',
  nature: '服务',
  risk: '低',
  channels: ['站内信'],
  locales: ['zh-CN'],
  sourceLocale: 'zh-CN',
  translationBatchId: '',
  translationReadiness: '已通过',
  version: 'v1',
  status: '已发布',
  updatedAt: '07-22 12:00',
  owner: '消息运营',
  usageScope: 'manual',
};
const events: SystemEventDefinition[] = [
  {
    id: 'deposit.credited',
    name: '充值到账',
    line: '资产',
    version: '1.0.0',
    caller: 'wallet-gateway',
    calls: '12.4K',
    failure: '0.04%',
    last: '18:06:31',
    status: '运行正常',
    variables: ['user_nickname', 'amount', 'currency', 'network', 'occurred_at'],
    defaultCategory: 'asset',
    defaultTopic: 'deposit',
    defaultRisk: '中',
  },
];

it('hides the owner team from artificial template details', () => {
  render(<TemplateReadOnlyDetails template={template} />);

  expect(screen.queryByText('所有者团队')).not.toBeInTheDocument();
});

it('keeps the owner team in event template details', () => {
  render(
    <TemplateReadOnlyDetails
      template={{
        ...template,
        eventId: 'deposit.credited',
        usageScope: 'event',
        owner: '资产运营',
      }}
      showOwnerTeam
      events={events}
    />,
  );

  expect(screen.getByText('所有者团队')).toBeVisible();
  expect(screen.getByText('资产运营')).toBeVisible();
  expect(screen.getByText('系统事件')).toBeVisible();
  expect(screen.getByText('充值到账')).toBeVisible();
  expect(screen.getByText('deposit.credited')).toBeVisible();
  expect(screen.queryByText('版本')).not.toBeInTheDocument();
});

it('keeps the lifecycle status generic while multilingual review is the current node', () => {
  render(
    <TemplateReadOnlyDetails
      template={{
        ...template,
        status: '审核中',
        workflowStage: 'localization_review',
      }}
    />,
  );

  expect(screen.getByText('审核中')).toBeVisible();
  expect(screen.queryByText('多语言审核中')).not.toBeInTheDocument();
});
