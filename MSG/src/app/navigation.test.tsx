import { navigationItems } from './navigation';

it('只展示 V2 一期后台导航', () => {
  const labels = navigationItems.map((item) => item.label);
  expect(labels).toEqual(['工作台','消息任务','消息模板','系统事件','用户与受众','审核中心','发送记录','数据分析','系统配置']);
  expect(labels).not.toContain('自动化流程');
  expect(labels).not.toContain('渠道管理');
  expect(labels).not.toContain('合规策略');
});
