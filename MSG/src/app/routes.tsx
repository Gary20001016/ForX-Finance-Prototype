import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import TaskListPage from '../pages/tasks/TaskListPage';
import TemplateListPage from '../pages/templates/TemplateListPage';
import SegmentListPage from '../pages/segments/SegmentListPage';
import EventListPage from '../pages/events/EventListPage';
import CreateTaskPage from '../pages/tasks/CreateTaskPage';
import ApprovalCenterPage from '../pages/approvals/ApprovalCenterPage';
import DeliveryPage from '../pages/deliveries/DeliveryPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import InboxPage from '../pages/inbox/InboxPage';
import MessageDetailPage from '../pages/inbox/MessageDetailPage';
import AutomationRuleListPage from '../pages/automation/AutomationRuleListPage';
import TriggerRecordPage from '../pages/triggers/TriggerRecordPage';

export const appRouter = createBrowserRouter([
  { path:'/inbox', element:<InboxPage /> },
  { path:'/inbox/:messageId', element:<MessageDetailPage /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path:'dashboard', element:<DashboardPage /> },
      { path:'tasks', element:<TaskListPage /> },
      { path:'tasks/create', element:<CreateTaskPage /> },
      { path:'automation', element:<AutomationRuleListPage /> },
      { path:'templates', element:<TemplateListPage /> },
      { path:'segments', element:<SegmentListPage /> },
      { path:'events', element:<EventListPage /> },
      { path:'triggers', element:<TriggerRecordPage /> },
      { path:'approvals', element:<ApprovalCenterPage /> },
      { path:'deliveries', element:<DeliveryPage /> },
      { path:'analytics', element:<AnalyticsPage /> },
      { path:'settings', element:<SettingsPage /> },
    ],
  },
]);
