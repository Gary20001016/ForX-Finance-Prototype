import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SegmentListPage from './SegmentListPage';

it('opens the create segment dialog', async () => {
  render(<SegmentListPage />);
  await userEvent.click(screen.getByRole('button', { name: '新建分群' }));
  expect(await screen.findByText('创建用户分群')).toBeVisible();
  expect(screen.getByText('分群名称')).toBeVisible();
  expect(screen.getAllByText('分群类型').length).toBeGreaterThan(0);
  expect(screen.getAllByText('数据刷新').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: '保存并计算' })).toBeVisible();
});

it('shows union and intersection controls for a combined segment', async () => {
  const user = userEvent.setup();
  render(<SegmentListPage />);

  await user.click(screen.getByRole('button', { name: '新建分群' }));
  await user.click(screen.getByRole('radio', { name: '组合分群' }));

  expect(await screen.findByText('组合规则')).toBeVisible();
  expect(
    screen.getByRole('radio', { name: '并集（满足任一分群）' }),
  ).toBeVisible();
  expect(
    screen.getByRole('radio', { name: '交集（同时满足全部分群）' }),
  ).toBeVisible();
  expect(screen.getByText('参与组合的分群')).toBeVisible();
  expect(screen.getByText('集合表达式')).toBeVisible();
});

it('allows an existing combined segment to be used as a new source', async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(<SegmentListPage />);

  await user.click(screen.getByRole('button', { name: '新建分群' }));
  await user.click(screen.getByRole('radio', { name: '组合分群' }));

  const sourceItem = screen
    .getByText('参与组合的分群', { selector: 'label' })
    .closest('.arco-form-item') as HTMLElement;
  await user.click(sourceItem.querySelector('.arco-select')!);

  expect(
    screen.getByRole('option', {
      name: /沉默交易且 ETH 活跃用户.*组合分群/,
    }),
  ).toBeVisible();
});

it('locks the segment type when editing an existing segment', async () => {
  const user = userEvent.setup();
  render(<SegmentListPage />);

  await user.click(screen.getAllByRole('button', { name: '查看' })[0]);
  await user.click(screen.getByRole('button', { name: '编辑规则' }));

  expect(await screen.findByText('创建后不可修改分群类型')).toBeVisible();
  expect(screen.getByRole('radio', { name: '动态条件' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: '静态名单' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: '组合分群' })).toBeDisabled();
});

it('clears the operator and threshold when the condition field changes', async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(<SegmentListPage />);

  await user.click(screen.getByRole('button', { name: '新建分群' }));

  const fieldItem = screen
    .getByText('字段', { selector: 'label' })
    .closest('.arco-form-item') as HTMLElement;
  const operatorItem = screen
    .getByText('运算符', { selector: 'label' })
    .closest('.arco-form-item') as HTMLElement;
  const thresholdItem = screen
    .getByText('阈值', { selector: 'label' })
    .closest('.arco-form-item') as HTMLElement;

  expect(within(operatorItem).getByText('距今超过')).toBeVisible();
  expect(within(thresholdItem).getByRole('spinbutton')).toHaveValue('30');

  await user.click(fieldItem.querySelector('.arco-select')!);
  await user.click(screen.getByRole('option', { name: 'KYC 国家' }));

  expect(within(operatorItem).queryByText('距今超过')).not.toBeInTheDocument();
  expect(within(thresholdItem).getByRole('combobox')).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  expect(within(thresholdItem).queryByText('天')).not.toBeInTheDocument();
});

it('shows field-level edit history in the segment detail drawer', async () => {
  const user = userEvent.setup();
  render(<SegmentListPage />);

  await user.click(screen.getAllByRole('button', { name: '查看' })[0]);

  expect(await screen.findByText('编辑日志')).toBeVisible();
  expect(screen.getAllByText('编辑规则').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Gary Ma').length).toBeGreaterThan(0);
  expect(screen.getAllByText('数据刷新').length).toBeGreaterThan(0);
  expect(screen.getAllByText('实时').length).toBeGreaterThan(0);
  expect(screen.getAllByText('每小时').length).toBeGreaterThan(0);
});

it('records changed fields after editing a segment', async () => {
  const user = userEvent.setup();
  render(<SegmentListPage />);

  await user.click(screen.getAllByRole('button', { name: '查看' })[0]);
  await user.click(screen.getByRole('button', { name: '编辑规则' }));

  const dialog = await screen.findByRole('dialog');
  const nameInput = within(dialog).getByRole('textbox');
  await user.clear(nameInput);
  await user.type(nameInput, '30天未交易且有余额用户');
  await user.click(
    within(dialog).getByRole('button', { name: '保存并计算' }),
  );

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await user.click(screen.getAllByRole('button', { name: '查看' })[0]);

  expect(
    (await screen.findAllByText('30天未交易且有余额用户')).length,
  ).toBeGreaterThan(0);
  expect(screen.getAllByText('近30天沉默交易用户').length).toBeGreaterThan(0);
});

it('shows creator instead of owner and only uses available segment status', () => {
  render(<SegmentListPage />);

  expect(screen.getByText('创建人')).toBeVisible();
  expect(screen.queryByText('所有者')).not.toBeInTheDocument();
  expect(screen.queryByText('数据健康')).not.toBeInTheDocument();
  expect(screen.queryByText('受保护')).not.toBeInTheDocument();
  expect(screen.getAllByText('可用')).toHaveLength(5);
});

it('prevents the current super administrator from editing another creator segment', async () => {
  const user = userEvent.setup();
  render(<SegmentListPage />);

  await user.click(screen.getAllByRole('button', { name: '查看' })[1]);

  expect((await screen.findAllByText('周屿')).length).toBeGreaterThan(0);
  expect(screen.getByText('仅创建人可编辑')).toBeVisible();
  expect(screen.getByRole('button', { name: '编辑规则' })).toBeDisabled();
});

it('automatically records the current operator as creator for a new segment', async () => {
  const user = userEvent.setup();
  render(<SegmentListPage />);

  await user.click(screen.getByRole('button', { name: '新建分群' }));
  const dialog = await screen.findByRole('dialog');

  expect(within(dialog).queryByText('所有者团队')).not.toBeInTheDocument();
  await user.type(within(dialog).getByRole('textbox'), 'Gary 的新分群');
  await user.click(
    within(dialog).getByRole('button', { name: '保存并计算' }),
  );

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await user.click(screen.getAllByRole('button', { name: '查看' })[0]);

  expect((await screen.findAllByText('创建人')).length).toBeGreaterThan(0);
  expect(screen.getAllByText('Gary Ma').length).toBeGreaterThan(0);
    expect(screen.getAllByText('计算中').length).toBeGreaterThan(0);
});
