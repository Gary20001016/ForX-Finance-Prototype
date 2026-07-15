import { navigationItems } from './navigation';

it('separates artificial tasks from event automation navigation', () => {
  const labels = navigationItems.map((item) => item.label);
  expect(labels).toEqual([
    '工作台',
    '人工消息任务',
    '事件通知规则',
    '消息模板',
    '事件目录',
    '触发记录',
    '用户与受众',
    '审核中心',
    '渠道发送记录',
    '数据分析',
    '系统配置',
  ]);
  expect(labels).not.toContain('消息任务');
  expect(labels).not.toContain('系统事件');
  expect(labels).not.toContain('渠道管理');
});
