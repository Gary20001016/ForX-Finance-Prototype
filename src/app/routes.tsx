import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import PlaceholderPage from '../pages/PlaceholderPage';

const placeholders = [
  ['dashboard', '工作台'],
  ['tasks', '消息任务'],
  ['templates', '消息模板'],
  ['segments', '用户分群'],
  ['automations', '自动化流程'],
  ['events', '事件管理'],
  ['approvals', '审核中心'],
  ['deliveries', '发送记录'],
  ['analytics', '数据分析'],
  ['channels', '渠道管理'],
  ['compliance', '合规策略'],
  ['settings', '系统配置'],
] as const;

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="工作台" /> },
      ...placeholders.map(([path, title]) => ({ path, element: <PlaceholderPage title={title} /> })),
    ],
  },
]);
