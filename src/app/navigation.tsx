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
import type { PagePermissionKey } from '../domain/pagePermissions';

export interface NavigationItem {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
  groupKey?: string;
  groupLabel?: string;
  permissionKey?: PagePermissionKey;
}

export interface NavigationGroup {
  key: string;
  label: string;
  icon: ReactNode;
  children: NavigationItem[];
}

const groupedItem = (
  groupKey: string,
  groupLabel: string,
  item: Omit<NavigationItem, 'groupKey' | 'groupLabel'>,
): NavigationItem => ({ ...item, groupKey, groupLabel });

export const dashboardNavigationItem: NavigationItem = {
  key: '/dashboard',
  path: '/dashboard',
  label: '工作台',
  icon: <IconDashboard />,
  permissionKey: 'dashboard',
};

export const audienceNavigationItem: NavigationItem = {
  key: '/segments',
  path: '/segments',
  label: '用户与受众',
  icon: <IconUserGroup />,
  permissionKey: 'audiences',
};

export const settingsNavigationItem: NavigationItem = {
  key: '/settings',
  path: '/settings',
  label: '系统配置',
  icon: <IconSettings />,
};

export const navigationGroups: NavigationGroup[] = [
  {
    key: 'manual-messaging',
    label: '人工消息',
    icon: <IconEmail />,
    children: [
      groupedItem('manual-messaging', '人工消息', {
        key: '/tasks',
        path: '/tasks',
        label: '人工消息任务',
        icon: <IconEmail />,
        permissionKey: 'manual.tasks',
      }),
      groupedItem('manual-messaging', '人工消息', {
        key: '/templates?scope=manual',
        path: '/templates',
        label: '人工消息模板',
        icon: <IconBook />,
        permissionKey: 'manual.templates',
      }),
      groupedItem('manual-messaging', '人工消息', {
        key: '/template-variables',
        path: '/template-variables',
        label: '模板变量',
        icon: <IconArchive />,
        permissionKey: 'manual.variables',
      }),
    ],
  },
  {
    key: 'event-automation',
    label: '事件自动化',
    icon: <IconExperiment />,
    children: [
      groupedItem('event-automation', '事件自动化', {
        key: '/automation',
        path: '/automation',
        label: '事件通知规则',
        icon: <IconExperiment />,
        permissionKey: 'event.rules',
      }),
      groupedItem('event-automation', '事件自动化', {
        key: '/templates?scope=event',
        path: '/templates',
        label: '事件消息模板',
        icon: <IconBook />,
        permissionKey: 'event.templates',
      }),
      groupedItem('event-automation', '事件自动化', {
        key: '/events',
        path: '/events',
        label: '事件目录',
        icon: <IconExperiment />,
        permissionKey: 'event.catalog',
      }),
      groupedItem('event-automation', '事件自动化', {
        key: '/triggers',
        path: '/triggers',
        label: '触发记录',
        icon: <IconArchive />,
        permissionKey: 'event.triggers',
      }),
    ],
  },
  {
    key: 'operations-governance',
    label: '运营与治理',
    icon: <IconCheckCircle />,
    children: [
      groupedItem('operations-governance', '运营与治理', {
        key: '/multilingual-review',
        path: '/multilingual-review',
        label: '多语言审核',
        icon: <IconCheckCircle />,
      }),
      groupedItem('operations-governance', '运营与治理', {
        key: '/approvals',
        path: '/approvals',
        label: '审核中心',
        icon: <IconCheckCircle />,
        permissionKey: 'operations.approvals',
      }),
      groupedItem('operations-governance', '运营与治理', {
        key: '/deliveries',
        path: '/deliveries',
        label: '发送记录',
        icon: <IconArchive />,
        permissionKey: 'operations.deliveries',
      }),
      groupedItem('operations-governance', '运营与治理', {
        key: '/analytics',
        path: '/analytics',
        label: '数据分析',
        icon: <IconArrowRise />,
        permissionKey: 'operations.analytics',
      }),
    ],
  },
];

export const navigationItems: NavigationItem[] = [
  dashboardNavigationItem,
  audienceNavigationItem,
  ...navigationGroups.flatMap((group) => group.children),
  settingsNavigationItem,
];

export const navigationContextForLocation = (
  pathname: string,
  search = '',
): NavigationItem | undefined => {
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    return dashboardNavigationItem;
  }
  if (pathname.startsWith('/templates')) {
    const scope =
      new URLSearchParams(search).get('scope') === 'event' ? 'event' : 'manual';
    return navigationItems.find(
      (item) => item.key === `/templates?scope=${scope}`,
    );
  }
  return navigationItems
    .filter((item) => pathname.startsWith(item.path))
    .sort((left, right) => right.path.length - left.path.length)[0];
};

export const labelForPath = (pathname: string, search = '') =>
  navigationContextForLocation(pathname, search)?.label ?? '工作台';
