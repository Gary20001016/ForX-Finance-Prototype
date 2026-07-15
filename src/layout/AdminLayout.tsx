import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Input,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconCommand,
  IconDown,
  IconMenuFold,
  IconMenuUnfold,
  IconNotification,
  IconSearch,
} from '@arco-design/web-react/icon';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  dashboardNavigationItem,
  navigationContextForLocation,
  navigationGroups,
  settingsNavigationItem,
} from '../app/navigation';
import { openPrototypeDialog } from '../utils/prototypeActions';

const { Sider, Header, Content } = Layout;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const activeNavigation = useMemo(
    () => navigationContextForLocation(location.pathname, location.search),
    [location.pathname, location.search],
  );
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    setOpenKeys(activeNavigation?.groupKey ? [activeNavigation.groupKey] : []);
  }, [activeNavigation?.groupKey]);

  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth < 1100);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout className="admin-shell">
      <Sider className="admin-sider" width={232} collapsed={collapsed} collapsedWidth={72}>
        <div className="brand-lockup">
          <div className="brand-mark">F</div>
          {!collapsed && <div><strong>ForX Finance</strong><span>消息中心</span></div>}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[activeNavigation?.key ?? '/dashboard']}
          openKeys={openKeys}
          onClickMenuItem={(key) => navigate(key)}
          onClickSubMenu={(_, keys) => setOpenKeys(keys)}
          className="admin-menu"
        >
          <Menu.Item key={dashboardNavigationItem.key} data-testid={`nav-${dashboardNavigationItem.key}`}>
            {dashboardNavigationItem.icon}{dashboardNavigationItem.label}
          </Menu.Item>
          {navigationGroups.map((group) => (
            <Menu.SubMenu
              key={group.key}
              title={<>{group.icon}{group.label}</>}
            >
              {group.children.map((item) => (
                <Menu.Item key={item.key} data-testid={`nav-${item.key}`}>
                  {item.icon}{item.label}
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          ))}
          <Menu.Item key={settingsNavigationItem.key} data-testid={`nav-${settingsNavigationItem.key}`}>
            {settingsNavigationItem.icon}{settingsNavigationItem.label}
          </Menu.Item>
        </Menu>
        {!collapsed && (
          <div className="sider-health">
            <span className="health-dot" />
            <div><strong>站内信正常</strong><span>App Push 正常</span></div>
          </div>
        )}
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Space size={12}>
            <Button
              type="text"
              icon={collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
              onClick={() => setCollapsed((value) => !value)}
              aria-label="切换侧栏"
            />
            <Breadcrumb>
              <Breadcrumb.Item key="root">消息中心</Breadcrumb.Item>
              {activeNavigation?.groupLabel && (
                <Breadcrumb.Item key={activeNavigation.groupKey}>{activeNavigation.groupLabel}</Breadcrumb.Item>
              )}
              <Breadcrumb.Item key={activeNavigation?.key ?? location.pathname}>{activeNavigation?.label ?? '工作台'}</Breadcrumb.Item>
            </Breadcrumb>
          </Space>
          <div className="header-actions">
            <Button size="small" type="outline" onClick={() => navigate('/inbox')}>用户消息中心</Button>
            <Tag color="gray" bordered><span className="env-dot" />演示环境</Tag>
            <Input
              className="global-search"
              prefix={<IconSearch />}
              suffix={<span className="search-kbd"><IconCommand /> K</span>}
              placeholder="搜索任务、模板、事件"
            />
            <Typography.Text type="secondary" className="timezone-label">UTC+8</Typography.Text>
            <Badge count={12} dot><Button type="text" icon={<IconNotification />} aria-label="通知" onClick={() => openPrototypeDialog('通知中心', '12 项待处理：5 项审批、3 项渠道告警、4 项系统通知。')} /></Badge>
            <Dropdown droplist={<Menu><Menu.Item key="profile">个人设置</Menu.Item><Menu.Item key="logout">退出</Menu.Item></Menu>}>
              <Space className="user-control">
                <Avatar size={32}>GM</Avatar>
                <span className="user-copy"><strong>Gary Ma</strong><small>超级管理员</small></span>
                <IconDown />
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="admin-content"><Outlet /></Content>
      </Layout>
    </Layout>
  );
}
