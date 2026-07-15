# “用户与受众”独立导航实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“用户与受众”从“人工消息”分组移出，改为“工作台”之后的一级导航入口。

**Architecture:** 继续使用 `src/app/navigation.tsx` 作为唯一导航模型来源，新增独立的 `audienceNavigationItem`，由布局在分组菜单之前渲染。路由仍为 `/segments`，页面及数据逻辑保持不变。

**Tech Stack:** React 18、TypeScript、React Router、Arco Design React、Vitest、Testing Library。

## Global Constraints

- 保留现有 `/segments` 路由和页面内容。
- 不修改人工任务受众选择、多语言进度或翻译审核功能。
- “用户与受众”面包屑仅显示“消息中心 / 用户与受众”。
- 先验证测试失败，再编写生产代码。

---

### Task 1: 提升“用户与受众”为一级导航

**Files:**
- Modify: `src/app/navigation.test.tsx`
- Modify: `src/layout/AdminLayout.test.tsx`
- Modify: `src/app/navigation.tsx`
- Modify: `src/layout/AdminLayout.tsx`
- Modify: `docs/prd/message-center/00-消息中心总览.md`

**Interfaces:**
- Produces: `audienceNavigationItem: NavigationItem`
- Consumes: `navigationContextForLocation(pathname, search)` 和 `AdminLayout` 现有导航渲染逻辑。

- [ ] **Step 1: 编写失败的导航模型测试**

```tsx
expect(navigationGroups[0].children.map((item) => item.label)).toEqual([
  '人工消息任务',
  '人工消息模板',
]);
expect(audienceNavigationItem).toMatchObject({
  key: '/segments',
  path: '/segments',
  label: '用户与受众',
  groupKey: undefined,
});
expect(navigationContextForLocation('/segments')).toMatchObject({
  key: '/segments',
  label: '用户与受众',
  groupKey: undefined,
});
```

- [ ] **Step 2: 编写失败的布局测试**

```tsx
render(
  <MemoryRouter initialEntries={['/segments']}>
    <AdminLayout />
  </MemoryRouter>,
);
expect(screen.getByTestId('nav-/segments')).toHaveClass('arco-menu-selected');
expect(screen.getAllByText('用户与受众')).toHaveLength(2);
expect(screen.queryByText('人工消息', { selector: '.arco-breadcrumb-item' })).not.toBeInTheDocument();
```

- [ ] **Step 3: 运行聚焦测试并确认失败**

Run: `npm test -- --run src/app/navigation.test.tsx src/layout/AdminLayout.test.tsx`

Expected: FAIL，因为“用户与受众”仍位于“人工消息”分组，且没有导出的 `audienceNavigationItem`。

- [ ] **Step 4: 实现独立导航项**

在 `src/app/navigation.tsx` 中定义并导出：

```tsx
export const audienceNavigationItem: NavigationItem = {
  key: '/segments',
  path: '/segments',
  label: '用户与受众',
  icon: <IconUserGroup />,
};
```

从 `manual-messaging.children` 删除 `/segments`，并将 `audienceNavigationItem` 放入扁平的 `navigationItems`：

```tsx
export const navigationItems: NavigationItem[] = [
  dashboardNavigationItem,
  audienceNavigationItem,
  ...navigationGroups.flatMap((group) => group.children),
  settingsNavigationItem,
];
```

- [ ] **Step 5: 在布局中渲染一级导航项**

在工作台菜单项后、分组菜单前加入：

```tsx
<Menu.Item
  key={audienceNavigationItem.key}
  data-testid={`nav-${audienceNavigationItem.key}`}
>
  {audienceNavigationItem.icon}{audienceNavigationItem.label}
</Menu.Item>
```

- [ ] **Step 6: 同步 PRD 导航表**

在 `docs/prd/message-center/00-消息中心总览.md` 中将“用户与受众”调整为独立一级入口，并从“人工消息”分组的子项中删除。

- [ ] **Step 7: 运行聚焦测试并确认通过**

Run: `npm test -- --run src/app/navigation.test.tsx src/layout/AdminLayout.test.tsx`

Expected: 两个测试文件全部通过。

- [ ] **Step 8: 运行完整验证**

Run: `npm test -- --run && npm run build && git diff --check`

Expected: 全部测试通过、生产构建成功、无空白错误。

- [ ] **Step 9: 提交实现**

```bash
git add src/app/navigation.tsx src/app/navigation.test.tsx src/layout/AdminLayout.tsx src/layout/AdminLayout.test.tsx docs/prd/message-center/00-消息中心总览.md docs/superpowers/plans/2026-07-15-standalone-audience-navigation.md
git commit -m "feat: promote audience navigation"
```
