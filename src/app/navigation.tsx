import type { ReactNode } from 'react';
import {
  IconApps,
  IconArchive,
  IconArrowRise,
  IconBook,
  IconBranch,
  IconCheckCircle,
  IconDashboard,
  IconEmail,
  IconExperiment,
  IconSafe,
  IconSettings,
  IconUserGroup,
} from '@arco-design/web-react/icon';

export interface NavigationItem {
  key: string;
  label: string;
  icon: ReactNode;
}

export const navigationItems: NavigationItem[] = [
  { key: '/dashboard', label: '工作台', icon: <IconDashboard /> },
  { key: '/tasks', label: '消息任务', icon: <IconEmail /> },
  { key: '/templates', label: '消息模板', icon: <IconBook /> },
  { key: '/segments', label: '用户分群', icon: <IconUserGroup /> },
  { key: '/automations', label: '自动化流程', icon: <IconBranch /> },
  { key: '/events', label: '事件管理', icon: <IconExperiment /> },
  { key: '/approvals', label: '审核中心', icon: <IconCheckCircle /> },
  { key: '/deliveries', label: '发送记录', icon: <IconArchive /> },
  { key: '/analytics', label: '数据分析', icon: <IconArrowRise /> },
  { key: '/channels', label: '渠道管理', icon: <IconApps /> },
  { key: '/compliance', label: '合规策略', icon: <IconSafe /> },
  { key: '/settings', label: '系统配置', icon: <IconSettings /> },
];

export const labelForPath = (pathname: string) =>
  navigationItems.find((item) => pathname.startsWith(item.key))?.label ?? '工作台';
