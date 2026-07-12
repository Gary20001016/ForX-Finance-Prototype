import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import PlaceholderPage from '../pages/PlaceholderPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import TaskListPage from '../pages/tasks/TaskListPage';
import TemplateListPage from '../pages/templates/TemplateListPage';
import SegmentListPage from '../pages/segments/SegmentListPage';
import EventListPage from '../pages/events/EventListPage';
import AutomationListPage from '../pages/automations/AutomationListPage';
import CreateTaskPage from '../pages/tasks/CreateTaskPage';
import ApprovalCenterPage from '../pages/approvals/ApprovalCenterPage';

const placeholders = [
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
      { index: true, element: <DashboardPage /> },
      { path:'dashboard', element:<DashboardPage /> },
      { path:'tasks', element:<TaskListPage /> },
      { path:'tasks/create', element:<CreateTaskPage /> },
      { path:'templates', element:<TemplateListPage /> },
      { path:'segments', element:<SegmentListPage /> },
      { path:'automations', element:<AutomationListPage /> },
      { path:'events', element:<EventListPage /> },
      { path:'approvals', element:<ApprovalCenterPage /> },
      ...placeholders.map(([path, title]) => ({ path, element: <PlaceholderPage title={title} /> })),
    ],
  },
]);
