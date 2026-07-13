import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import TaskListPage from '../pages/tasks/TaskListPage';
import TemplateListPage from '../pages/templates/TemplateListPage';
import SegmentListPage from '../pages/segments/SegmentListPage';
import EventListPage from '../pages/events/EventListPage';
import AutomationListPage from '../pages/automations/AutomationListPage';
import CreateTaskPage from '../pages/tasks/CreateTaskPage';
import ApprovalCenterPage from '../pages/approvals/ApprovalCenterPage';
import DeliveryPage from '../pages/deliveries/DeliveryPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import ChannelManagementPage from '../pages/channels/ChannelManagementPage';
import CompliancePage from '../pages/compliance/CompliancePage';
import SettingsPage from '../pages/settings/SettingsPage';
import InboxPage from '../pages/inbox/InboxPage';
import MessageDetailPage from '../pages/inbox/MessageDetailPage';

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
      { path:'templates', element:<TemplateListPage /> },
      { path:'segments', element:<SegmentListPage /> },
      { path:'automations', element:<AutomationListPage /> },
      { path:'events', element:<EventListPage /> },
      { path:'approvals', element:<ApprovalCenterPage /> },
      { path:'deliveries', element:<DeliveryPage /> },
      { path:'analytics', element:<AnalyticsPage /> },
      { path:'channels', element:<ChannelManagementPage /> },
      { path:'compliance', element:<CompliancePage /> },
      { path:'settings', element:<SettingsPage /> },
    ],
  },
]);
