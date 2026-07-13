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
import { labelForPath, navigationItems } from '../app/navigation';
import { openPrototypeDialog } from '../utils/prototypeActions';

const { Sider, Header, Content } = Layout;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const activePath = useMemo(
    () => navigationItems.find((item) => location.pathname.startsWith(item.key))?.key ?? '/dashboard',
    [location.pathname],
  );

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
          <div className="brand-mark">N</div>
          {!collapsed && <div><strong>NEXUS</strong><span>消息中心</span></div>}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[activePath]}
          onClickMenuItem={(key) => navigate(key)}
          className="admin-menu"
        >
          {navigationItems.map((item) => (
            <Menu.Item key={item.key} data-testid={`nav-${item.key}`}>
              {item.icon}{item.label}
            </Menu.Item>
          ))}
        </Menu>
        {!collapsed && (
          <div className="sider-health">
            <span className="health-dot" />
            <div><strong>渠道运行正常</strong><span>4/4 可用</span></div>
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
              <Breadcrumb.Item key={location.pathname}>{labelForPath(location.pathname)}</Breadcrumb.Item>
            </Breadcrumb>
          </Space>
          <div className="header-actions">
            <Tag color="gray" bordered><span className="env-dot" />PROD · 只读原型</Tag>
            <Input
              className="global-search"
              prefix={<IconSearch />}
              suffix={<span className="search-kbd"><IconCommand /> K</span>}
              placeholder="搜索任务、模板、用户"
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
