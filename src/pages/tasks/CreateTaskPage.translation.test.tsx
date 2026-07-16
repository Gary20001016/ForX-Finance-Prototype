import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getPrototypeState } from '../../store/prototypeStore';
import CreateTaskPage from './CreateTaskPage';

it('only offers translation-approved reusable templates that cover selected channels', () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  expect(screen.getByText('仅显示全部目标语言人工审核通过的模板版本')).toBeVisible();
  expect(screen.getByText('翻译审核通过')).toBeVisible();
  expect(screen.getByText(/VIP 等级权益调整通知 · v5/)).toBeVisible();
  expect(screen.queryByText(/异常登录提醒 · v16/)).not.toBeInTheDocument();
  expect(screen.queryByText('提现成功通知 · v12')).not.toBeInTheDocument();
  expect(screen.queryByText('夏季交易赛 · v4')).not.toBeInTheDocument();
});

it('does not offer temporary task translation carriers as approved templates', () => {
  const store = getPrototypeState();
  const reusable = store.templates.find((item) => item.id === 'TPL-1007');
  if (!reusable) throw new Error('missing reusable template fixture');
  store.templates.unshift({
    ...reusable,
    id: 'TPL-TEMP-001',
    code: 'temporary_001',
    name: '临时消息 · 未命名',
    owner: '临时任务',
  });

  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  expect(screen.queryByText(/临时消息 · 未命名/)).not.toBeInTheDocument();
  expect(screen.getByText(/VIP 等级权益调整通知 · v5/)).toBeVisible();
});
