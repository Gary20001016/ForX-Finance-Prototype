import {
  navigationContextForLocation,
  navigationGroups,
  navigationItems,
} from './navigation';

it('groups navigation by manual, event and governance workflows', () => {
  expect(navigationGroups.map((group) => group.label)).toEqual([
    '人工消息',
    '事件自动化',
    '运营与治理',
  ]);
  expect(navigationGroups.map((group) => group.children.map((item) => item.label))).toEqual([
    ['人工消息任务', '人工消息模板', '用户与受众'],
    ['事件通知规则', '事件消息模板', '事件目录', '触发记录'],
    ['多语言审核', '审核中心', '发送记录', '数据分析'],
  ]);
  expect(navigationItems.map((item) => item.label)).toContain('系统配置');
});

it('resolves both template entries from one route', () => {
  expect(
    navigationContextForLocation('/templates', '?scope=event'),
  ).toMatchObject({
    key: '/templates?scope=event',
    groupLabel: '事件自动化',
    label: '事件消息模板',
  });
  expect(navigationContextForLocation('/templates', '')).toMatchObject({
    key: '/templates?scope=manual',
    groupLabel: '人工消息',
    label: '人工消息模板',
  });
  expect(
    navigationContextForLocation('/templates', '?scope=unknown'),
  ).toMatchObject({ key: '/templates?scope=manual' });
});
