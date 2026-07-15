import { render, screen } from '@testing-library/react';
import StatusTag from './StatusTag';

it.each([
  '发送中',
  '已完成',
  '待审核',
  '待修改',
  '未开始',
  '处理中',
  '成功',
  '部分失败',
  '失败',
])('renders semantic status %s', (status) => {
  render(<StatusTag status={status} />);
  expect(screen.getByText(status)).toBeVisible();
});
