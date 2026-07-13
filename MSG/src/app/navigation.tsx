import type { ReactNode } from 'react';
import {
  IconArchive,
  IconArrowRise,
  IconBook,
  IconCheckCircle,
  IconDashboard,
  IconEmail,
  IconExperiment,
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
  { key: '/events', label: '系统事件', icon: <IconExperiment /> },
  { key: '/segments', label: '用户与受众', icon: <IconUserGroup /> },
  { key: '/approvals', label: '审核中心', icon: <IconCheckCircle /> },
  { key: '/deliveries', label: '发送记录', icon: <IconArchive /> },
  { key: '/analytics', label: '数据分析', icon: <IconArrowRise /> },
  { key: '/settings', label: '系统配置', icon: <IconSettings /> },
];

export const labelForPath = (pathname: string) =>
  navigationItems.find((item) => pathname.startsWith(item.key))?.label ?? '工作台';
