export type PagePermissionKey =
  | "dashboard"
  | "audiences"
  | "manual.tasks"
  | "manual.templates"
  | "manual.variables"
  | "event.rules"
  | "event.templates"
  | "event.catalog"
  | "event.triggers"
  | "operations.approvals"
  | "operations.deliveries"
  | "operations.analytics"
  | "settings.categories"
  | "settings.links"
  | "settings.languageReview"
  | "settings.testAccounts"
  | "settings.audit";

export interface PageAccess {
  read: boolean;
  write: boolean;
}

export type PagePermissionMap = Record<PagePermissionKey, PageAccess>;

export interface PagePermissionResource {
  key: PagePermissionKey;
  label: string;
}

export interface PagePermissionGroup {
  key: "pages" | "settings";
  label: string;
  resources: PagePermissionResource[];
}

export const pagePermissionGroups: PagePermissionGroup[] = [
  {
    key: "pages",
    label: "后台页面",
    resources: [
      { key: "dashboard", label: "工作台" },
      { key: "audiences", label: "用户与受众" },
      { key: "manual.tasks", label: "人工消息任务" },
      { key: "manual.templates", label: "人工消息模板" },
      { key: "manual.variables", label: "模板变量" },
      { key: "event.rules", label: "事件通知规则" },
      { key: "event.templates", label: "事件消息模板" },
      { key: "event.catalog", label: "事件目录" },
      { key: "event.triggers", label: "触发记录" },
      { key: "operations.approvals", label: "审核中心" },
      { key: "operations.deliveries", label: "发送记录" },
      { key: "operations.analytics", label: "数据分析" },
    ],
  },
  {
    key: "settings",
    label: "系统配置",
    resources: [
      { key: "settings.categories", label: "消息分类" },
      { key: "settings.links", label: "跳转白名单" },
      { key: "settings.languageReview", label: "语言审核策略" },
      { key: "settings.testAccounts", label: "测试账号" },
      { key: "settings.audit", label: "审计日志" },
    ],
  },
];

export const pagePermissionResources = pagePermissionGroups.flatMap(
  (group) => group.resources,
);

export const pagePermissionKeys = pagePermissionResources.map(
  (resource) => resource.key,
);

export const settingsPermissionKeys = pagePermissionGroups.find(
  (group) => group.key === "settings",
)!.resources.map((resource) => resource.key);

export const pagePermissionLabel = (key: PagePermissionKey) =>
  pagePermissionResources.find((resource) => resource.key === key)?.label || key;

export const createPagePermissions = (
  readKeys: PagePermissionKey[] = pagePermissionKeys,
  writeKeys: PagePermissionKey[] = [],
): PagePermissionMap => {
  const readable = new Set(readKeys);
  const writable = new Set(writeKeys);
  return Object.fromEntries(
    pagePermissionKeys.map((key) => {
      const write = writable.has(key);
      return [key, { read: readable.has(key) || write, write }];
    }),
  ) as PagePermissionMap;
};

export const fullPagePermissions = () =>
  createPagePermissions(pagePermissionKeys, pagePermissionKeys);

export const readOnlyPagePermissions = () => createPagePermissions();

export const normalizePagePermissions = (
  permissions: Partial<Record<PagePermissionKey, Partial<PageAccess>>> | undefined,
  fallback: PagePermissionMap = readOnlyPagePermissions(),
): PagePermissionMap =>
  Object.fromEntries(
    pagePermissionKeys.map((key) => {
      const saved = permissions?.[key];
      const read = saved?.read ?? fallback[key].read;
      const write = saved?.write ?? fallback[key].write;
      return [key, { read: Boolean(read || write), write: Boolean(write) }];
    }),
  ) as PagePermissionMap;

export interface PagePermissionSubject {
  enabled: boolean;
  isSuperAdmin: boolean;
  pagePermissions?: Partial<Record<PagePermissionKey, Partial<PageAccess>>>;
}

export const canReadPage = (
  operator: PagePermissionSubject | undefined,
  key: PagePermissionKey,
) =>
  Boolean(
    operator?.enabled &&
      (operator.isSuperAdmin || operator.pagePermissions?.[key]?.read),
  );

export const canWritePage = (
  operator: PagePermissionSubject | undefined,
  key: PagePermissionKey,
) =>
  Boolean(
    operator?.enabled &&
      (operator.isSuperAdmin ||
        (operator.pagePermissions?.[key]?.read &&
          operator.pagePermissions?.[key]?.write)),
  );

export const hasAnySettingsReadAccess = (
  operator: PagePermissionSubject | undefined,
) => settingsPermissionKeys.some((key) => canReadPage(operator, key));
