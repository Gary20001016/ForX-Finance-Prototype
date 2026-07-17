import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { MessageTask } from '../../domain/types';
import {
  createTranslationBatch,
  getPrototypeState,
  saveTemplate,
} from '../../store/prototypeStore';
import CreateTaskPage from './CreateTaskPage';

it('authors a temporary multilingual Web and Push message and previews entered content', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  await user.type(screen.getByPlaceholderText('例如：夏季交易赛召回'), '临时安全提醒');
  await user.click(screen.getByText('临时消息'));
  expect(screen.getByLabelText('站内信标题')).toBeVisible();
  expect(screen.getByLabelText('Push 标题')).toBeVisible();
  expect(screen.queryByText('优先级', { selector: 'label' })).not.toBeInTheDocument();
  expect(screen.queryByText('折叠键', { selector: 'label' })).not.toBeInTheDocument();
  expect(screen.getByText('创建外部机翻任务')).toBeVisible();
});

it('restores the full translation progress for a temporary multilingual message', () => {
  const sourceTemplate = getPrototypeState().templates[0];
  const temporaryTemplate = saveTemplate({
    code: 'temporary_progress_test',
    name: '临时消息 · 翻译进度测试',
    category: '系统公告',
    nature: '事务',
    risk: '中',
    channels: ['站内信', 'Push'],
    locales: ['zh-CN', 'en-US', 'ja-JP'],
    sourceLocale: 'zh-CN',
    content: sourceTemplate.content,
    variables: sourceTemplate.variables || [],
    owner: '临时任务',
    usageScope: 'manual',
  });
  const batch = createTranslationBatch({
    templateId: temporaryTemplate.id,
    targetLocales: ['en-US', 'ja-JP'],
    createdBy: 'Gary Ma',
  });
  const baseTask = getPrototypeState().tasks.find(
    (task) => task.id === 'MSG-260712-007',
  );
  const temporaryTask: MessageTask = {
    ...baseTask!,
    contentMode: 'temporary',
    content: {
      ...sourceTemplate.content!,
      locales: ['zh-CN', 'en-US', 'ja-JP'],
    },
    translationBatchId: batch.id,
  };

  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/tasks/create',
          state: { copyTask: temporaryTask, resume: true },
        },
      ]}
    >
      <CreateTaskPage />
    </MemoryRouter>,
  );

  expect(screen.getByText('语言审核进度')).toBeVisible();
  expect(screen.getByText('0/2 个目标语言已通过')).toBeVisible();
  expect(screen.getByText('逐语言结果')).toBeVisible();
  expect(screen.getByRole('button', { name: '当场校对并确认' })).toBeVisible();
  expect(screen.getByRole('button', { name: '前往专项审核' })).toBeVisible();
});
