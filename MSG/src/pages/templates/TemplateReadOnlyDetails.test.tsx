import { render, screen } from '@testing-library/react';
import type { MessageTemplate } from '../../domain/types';
import TemplateReadOnlyDetails from './TemplateReadOnlyDetails';

const template: MessageTemplate = {
  id: 'TPL-TEST',
  code: 'test_template',
  name: '测试模板',
  category: '系统公告',
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

it('hides the owner team from artificial template details', () => {
  render(<TemplateReadOnlyDetails template={template} />);

  expect(screen.queryByText('所有者团队')).not.toBeInTheDocument();
});

it('keeps the owner team in event template details', () => {
  render(
    <TemplateReadOnlyDetails
      template={{ ...template, usageScope: 'event' }}
      showOwnerTeam
    />,
  );

  expect(screen.getByText('所有者团队')).toBeVisible();
  expect(screen.queryByText('版本')).not.toBeInTheDocument();
});
